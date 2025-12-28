package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type WithdrawalHandler struct {
	withdrawalService *services.WithdrawalService
}

func NewWithdrawalHandler(withdrawalService *services.WithdrawalService) *WithdrawalHandler {
	return &WithdrawalHandler{withdrawalService: withdrawalService}
}

func (h *WithdrawalHandler) CreateWithdrawal(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.CreateWithdrawalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	withdrawal, err := h.withdrawalService.CreateWithdrawal(userID.(uuid.UUID), &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("WithdrawalHandler.CreateWithdrawal", err, "Failed to create")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Withdrawal request submitted", withdrawal)
}

func (h *WithdrawalHandler) GetWithdrawals(c *gin.Context) {
	userID, _ := c.Get("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	withdrawals, err := h.withdrawalService.GetWithdrawals(userID.(uuid.UUID), page, limit)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("WithdrawalHandler.GetWithdrawals", err, "Failed to get")
		utils.InternalError(c, "Failed to get withdrawals")
		return
	}

	utils.Success(c, http.StatusOK, "", gin.H{
		"withdrawals": withdrawals,
		"page":        page,
		"limit":       limit,
	})
}

func (h *WithdrawalHandler) GetBalance(c *gin.Context) {
	userID, _ := c.Get("user_id")

	balance, err := h.withdrawalService.GetBalance(userID.(uuid.UUID))
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("WithdrawalHandler.GetBalance", err, "Failed to get balance")
		utils.InternalError(c, "Failed to get balance")
		return
	}

	utils.Success(c, http.StatusOK, "", balance)
}
