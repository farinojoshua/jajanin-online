package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
	"github.com/jajanin/backend/internal/utils"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db           *gorm.DB
	settingsRepo *repository.SystemSettingsRepository
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{
		db:           db,
		settingsRepo: repository.NewSystemSettingsRepository(db),
	}
}

// AdminStats represents admin dashboard statistics
type AdminStats struct {
	TotalUsers       int64   `json:"total_users"`
	TotalCreators    int64   `json:"total_creators"`
	TotalDonations   int64   `json:"total_donations"`
	TotalRevenue     float64 `json:"total_revenue"`
	PendingWithdraws int64   `json:"pending_withdrawals"`
	TotalProducts    int64   `json:"total_products"`
}

// GetStats returns admin dashboard stats
func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats AdminStats

	// Count users
	h.db.Model(&models.User{}).Count(&stats.TotalUsers)

	// Count creators (users with username set)
	h.db.Model(&models.User{}).Where("username IS NOT NULL AND username != ''").Count(&stats.TotalCreators)

	// Count donations
	h.db.Model(&models.Donation{}).Where("payment_status = 'paid'").Count(&stats.TotalDonations)

	// Sum revenue
	h.db.Model(&models.Donation{}).Where("payment_status = 'paid'").Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalRevenue)

	// Pending withdrawals
	h.db.Model(&models.Withdrawal{}).Where("status = 'pending'").Count(&stats.PendingWithdraws)

	// Total products
	h.db.Model(&models.QuickItem{}).Count(&stats.TotalProducts)

	utils.Success(c, http.StatusOK, "", stats)
}

// GetUsers returns list of all users with pagination
func (h *AdminHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Get total count
	var total int64
	h.db.Model(&models.User{}).Count(&total)

	var users []models.User
	if err := h.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		utils.InternalError(c, "Gagal mengambil data users")
		return
	}

	// Return safe user data
	var result []gin.H
	for _, u := range users {
		result = append(result, gin.H{
			"id":         u.ID,
			"email":      u.Email,
			"name":       u.Name,
			"username":   u.Username,
			"role":       u.Role,
			"image_url":  u.ImageURL,
			"created_at": u.CreatedAt,
		})
	}

	utils.Success(c, http.StatusOK, "", gin.H{
		"users":       result,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

// GetWithdrawals returns list of all withdrawals with pagination
func (h *AdminHandler) GetWithdrawals(c *gin.Context) {
	status := c.Query("status") // pending, approved, rejected
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Withdrawal{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	var withdrawals []models.Withdrawal
	if err := query.Preload("User").Order("created_at DESC").Limit(limit).Offset(offset).Find(&withdrawals).Error; err != nil {
		utils.InternalError(c, "Gagal mengambil data withdrawals")
		return
	}

	utils.Success(c, http.StatusOK, "", gin.H{
		"withdrawals": withdrawals,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

// ApproveWithdrawal approves a withdrawal
func (h *AdminHandler) ApproveWithdrawal(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	var withdrawal models.Withdrawal
	if err := h.db.First(&withdrawal, "id = ?", id).Error; err != nil {
		utils.NotFound(c, "Withdrawal tidak ditemukan")
		return
	}

	if withdrawal.Status != "pending" {
		utils.BadRequest(c, "Withdrawal sudah diproses sebelumnya")
		return
	}

	withdrawal.Status = "approved"
	if err := h.db.Save(&withdrawal).Error; err != nil {
		utils.InternalError(c, "Gagal approve withdrawal")
		return
	}

	utils.Success(c, http.StatusOK, "Withdrawal berhasil diapprove", withdrawal)
}

// RejectWithdrawal rejects a withdrawal and refunds balance
func (h *AdminHandler) RejectWithdrawal(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	var input struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&input)

	var withdrawal models.Withdrawal
	if err := h.db.First(&withdrawal, "id = ?", id).Error; err != nil {
		utils.NotFound(c, "Withdrawal tidak ditemukan")
		return
	}

	if withdrawal.Status != "pending" {
		utils.BadRequest(c, "Withdrawal sudah diproses sebelumnya")
		return
	}

	// Start transaction
	tx := h.db.Begin()

	// Update withdrawal status
	withdrawal.Status = "rejected"
	if input.Reason != "" {
		withdrawal.Notes = input.Reason
	}
	if err := tx.Save(&withdrawal).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Gagal reject withdrawal")
		return
	}

	// Refund the amount by creating a credit donation (or adjust balance logic)
	// For simplicity, we just mark it rejected - the balance should recalculate
	// In a real system, you'd want to track this more carefully

	tx.Commit()

	utils.Success(c, http.StatusOK, "Withdrawal berhasil direject", withdrawal)
}

// GetSettings returns the current system settings
func (h *AdminHandler) GetSettings(c *gin.Context) {
	settings, err := h.settingsRepo.GetSettings()
	if err != nil {
		utils.InternalError(c, "Gagal mengambil settings")
		return
	}

	utils.Success(c, http.StatusOK, "", settings)
}

// UpdateSettings updates the system settings
func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var input struct {
		AdminFeePercent float64 `json:"admin_fee_percent" binding:"required,min=0,max=100"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Persentase biaya admin harus antara 0-100")
		return
	}

	settings, err := h.settingsRepo.GetSettings()
	if err != nil {
		utils.InternalError(c, "Gagal mengambil settings")
		return
	}

	settings.AdminFeePercent = input.AdminFeePercent
	if err := h.settingsRepo.UpdateSettings(settings); err != nil {
		utils.InternalError(c, "Gagal menyimpan settings")
		return
	}

	utils.Success(c, http.StatusOK, "Settings berhasil diperbarui", settings)
}

// CompleteWithdrawal marks a withdrawal as completed after manual transfer
func (h *AdminHandler) CompleteWithdrawal(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	var input struct {
		Notes string `json:"notes"` // Optional: transfer reference number
	}
	c.ShouldBindJSON(&input)

	var withdrawal models.Withdrawal
	if err := h.db.First(&withdrawal, "id = ?", id).Error; err != nil {
		utils.NotFound(c, "Withdrawal tidak ditemukan")
		return
	}

	// Only approved/processing withdrawals can be completed
	if withdrawal.Status != models.WithdrawalStatusProcessing &&
		withdrawal.Status != "approved" {
		utils.BadRequest(c, "Withdrawal harus dalam status approved/processing untuk ditandai selesai")
		return
	}

	now := time.Now()
	withdrawal.Status = models.WithdrawalStatusCompleted
	withdrawal.ProcessedAt = &now
	if input.Notes != "" {
		withdrawal.Notes = input.Notes
	}

	if err := h.db.Save(&withdrawal).Error; err != nil {
		utils.InternalError(c, "Gagal update withdrawal")
		return
	}

	utils.Success(c, http.StatusOK, "Withdrawal berhasil ditandai selesai", withdrawal)
}
