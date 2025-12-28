package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type DonationHandler struct {
	donationService *services.DonationService
}

func NewDonationHandler(donationService *services.DonationService) *DonationHandler {
	return &DonationHandler{donationService: donationService}
}

func (h *DonationHandler) CreateDonation(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)

	var input services.CreateDonationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var buyerID *uuid.UUID
	if userID, exists := c.Get("user_id"); exists {
		id := userID.(uuid.UUID)
		buyerID = &id
	}

	resp, err := h.donationService.CreateDonation(log, &input, buyerID)
	if err != nil {
		log.LogError("DonationHandler.CreateDonation", err, "Failed to create donation")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Donation created", resp)
}

func (h *DonationHandler) GetDonations(c *gin.Context) {
	userID, _ := c.Get("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	donations, total, err := h.donationService.GetCreatorDonationsWithCount(userID.(uuid.UUID), page, limit)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("DonationHandler.GetDonations", err, "Failed to get donations")
		utils.InternalError(c, "Failed to get donations")
		return
	}

	utils.Success(c, http.StatusOK, "", gin.H{
		"donations":   donations,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

func (h *DonationHandler) GetRecentDonations(c *gin.Context) {
	username := c.Param("username")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))

	if limit < 1 || limit > 20 {
		limit = 5
	}

	donations, err := h.donationService.GetRecentDonations(username, limit)
	if err != nil {
		utils.NotFound(c, "Creator not found")
		return
	}

	var response []map[string]interface{}
	for _, d := range donations {
		item := map[string]interface{}{
			"id":         d.ID,
			"buyer_name": d.BuyerName,
			"amount":     d.Amount,
			"quantity":   d.Quantity,
			"message":    d.Message,
			"created_at": d.CreatedAt,
		}

		// Include denormalized product info if available
		if d.ProductName != "" {
			item["product_name"] = d.ProductName
			item["product_emoji"] = d.ProductEmoji
		}

		response = append(response, item)
	}

	utils.Success(c, http.StatusOK, "", response)
}

func (h *DonationHandler) GetStats(c *gin.Context) {
	userID, _ := c.Get("user_id")

	stats, err := h.donationService.GetStats(userID.(uuid.UUID))
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("DonationHandler.GetStats", err, "Failed to get stats")
		utils.InternalError(c, "Failed to get stats")
		return
	}

	monthlyStats, _ := h.donationService.GetMonthlyStats(userID.(uuid.UUID))
	dailyStats, _ := h.donationService.GetDailyStats(userID.(uuid.UUID), 30)

	utils.Success(c, http.StatusOK, "", gin.H{
		"total":   stats,
		"monthly": monthlyStats,
		"daily":   dailyStats,
	})
}
