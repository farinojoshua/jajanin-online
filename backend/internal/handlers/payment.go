package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type PaymentHandler struct {
	paylabsService  *services.PaylabsService
	donationService *services.DonationService
}

func NewPaymentHandler(paylabsService *services.PaylabsService, donationService *services.DonationService) *PaymentHandler {
	return &PaymentHandler{
		paylabsService:  paylabsService,
		donationService: donationService,
	}
}

func (h *PaymentHandler) PaylabsWebhook(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.LogError("PaymentHandler.PaylabsWebhook", err, "Failed to read body")
		utils.BadRequest(c, "Failed to read request body")
		return
	}

	var payload services.PaylabsWebhookPayload
	if err := utils.ParseJSON(body, &payload); err != nil {
		log.LogError("PaymentHandler.PaylabsWebhook", err, "Invalid body")
		utils.BadRequest(c, "Invalid request body")
		return
	}

	signature := c.GetHeader("X-SIGNATURE")
	timestamp := c.GetHeader("X-TIMESTAMP")
	if !h.paylabsService.VerifyWebhookSignature(signature, timestamp, string(body)) {
		log.LogWarn("PaymentHandler.PaylabsWebhook", "Invalid signature for: "+payload.MerchantTradeNo)
		utils.Unauthorized(c, "Invalid signature")
		return
	}

	orderID := payload.MerchantTradeNo
	status := h.paylabsService.ParseStatus(payload.Status)

	if err := h.donationService.UpdatePaymentStatus(log, orderID, status); err != nil {
		log.LogError("PaymentHandler.PaylabsWebhook", err, "Failed to update status")
		utils.InternalError(c, "Failed to update payment status")
		return
	}

	log.Info().Str("order", orderID).Str("status", string(status)).Msg("Payment processed")
	utils.Success(c, http.StatusOK, "OK", nil)
}

// CheckPaymentStatus polls Paylabs API for payment status (for localhost testing without webhook)
func (h *PaymentHandler) CheckPaymentStatus(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)
	orderID := c.Param("orderID")

	if orderID == "" {
		utils.BadRequest(c, "Order ID is required")
		return
	}

	// Get donation to determine payment method
	donation, err := h.donationService.GetDonationByPaymentID(orderID)
	if err != nil {
		// If donation not found, try QRIS as default
		log.LogWarn("PaymentHandler.CheckPaymentStatus", "Donation not found, using QRIS: "+orderID)
	}

	// Determine payment method (default to qris if donation not found)
	paymentMethod := "qris"
	if donation != nil && donation.PaymentMethod != "" {
		paymentMethod = donation.PaymentMethod
	}

	// Query status from Paylabs using the correct endpoint
	statusResp, err := h.paylabsService.QueryTransaction(log, orderID, paymentMethod)
	if err != nil {
		log.LogError("PaymentHandler.CheckPaymentStatus", err, "Failed to query status")
		utils.InternalError(c, "Failed to check payment status")
		return
	}

	// Check errCode first
	if statusResp.ErrCode != "0" {
		utils.Success(c, http.StatusOK, "Status check completed", gin.H{
			"status":       "error",
			"err_code":     statusResp.ErrCode,
			"err_code_des": statusResp.ErrCodeDes,
		})
		return
	}

	// If status is 02 (success), update donation status
	if statusResp.Status == "02" {
		status := h.paylabsService.ParseStatus(statusResp.Status)
		if err := h.donationService.UpdatePaymentStatus(log, orderID, status); err != nil {
			log.LogError("PaymentHandler.CheckPaymentStatus", err, "Failed to update status")
			// Still return success to frontend, just log the error
		}
	}

	utils.Success(c, http.StatusOK, "Status check completed", gin.H{
		"status":       statusResp.Status, // 01=pending, 02=success, 09=failed
		"success_time": statusResp.SuccessTime,
		"payer":        statusResp.Payer,
	})
}

// CancelPayment cancels a pending QRIS order
func (h *PaymentHandler) CancelPayment(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)

	var input struct {
		MerchantTradeNo string `json:"merchant_trade_no" binding:"required"`
		PlatformTradeNo string `json:"platform_trade_no" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "merchant_trade_no and platform_trade_no are required")
		return
	}

	// Try to cancel via Paylabs (might fail in sandbox)
	cancelResp, err := h.paylabsService.CancelTransaction(log, input.MerchantTradeNo, input.PlatformTradeNo)
	if err != nil {
		log.LogWarn("PaymentHandler.CancelPayment", "Paylabs cancel failed (may not be supported in sandbox): "+err.Error())
		// Continue anyway - update local status
	}

	// Log if Paylabs returned error (but don't fail)
	if cancelResp != nil && cancelResp.ErrCode != "0" {
		log.LogWarn("PaymentHandler.CancelPayment", "Paylabs cancel returned: "+cancelResp.ErrCode+" - "+cancelResp.ErrCodeDes)
	}

	// Update donation status to failed/cancelled locally
	if err := h.donationService.UpdatePaymentStatus(log, input.MerchantTradeNo, h.paylabsService.ParseStatus("09")); err != nil {
		log.LogError("PaymentHandler.CancelPayment", err, "Failed to update status")
		// Still return success to frontend
	}

	utils.Success(c, http.StatusOK, "Payment cancelled", gin.H{
		"success": true,
	})
}
