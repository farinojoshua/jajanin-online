package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

type DonationRepository struct {
	db *gorm.DB
}

func NewDonationRepository(db *gorm.DB) *DonationRepository {
	return &DonationRepository{db: db}
}

func (r *DonationRepository) Create(donation *models.Donation) error {
	return r.db.Create(donation).Error
}

func (r *DonationRepository) FindProductByID(id uuid.UUID) (*models.QuickItem, error) {
	var product models.QuickItem
	err := r.db.First(&product, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *DonationRepository) FindByID(id uuid.UUID) (*models.Donation, error) {
	var donation models.Donation
	err := r.db.Preload("Creator").First(&donation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &donation, nil
}

func (r *DonationRepository) FindByIDWithProduct(id uuid.UUID) (*models.Donation, error) {
	var donation models.Donation
	err := r.db.Preload("Product").First(&donation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &donation, nil
}

func (r *DonationRepository) FindByPaymentID(paymentID string) (*models.Donation, error) {
	var donation models.Donation
	err := r.db.First(&donation, "payment_id = ?", paymentID).Error
	if err != nil {
		return nil, err
	}
	return &donation, nil
}

func (r *DonationRepository) FindByCreatorID(creatorID uuid.UUID, limit, offset int) ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Where("creator_id = ? AND payment_status = ?", creatorID, models.PaymentStatusPaid).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&donations).Error
	return donations, err
}

func (r *DonationRepository) CountByCreatorID(creatorID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Donation{}).
		Where("creator_id = ? AND payment_status = ?", creatorID, models.PaymentStatusPaid).
		Count(&count).Error
	return count, err
}

func (r *DonationRepository) FindRecentByCreatorID(creatorID uuid.UUID, limit int) ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Where("creator_id = ? AND payment_status = ?", creatorID, models.PaymentStatusPaid).
		Order("created_at DESC").
		Limit(limit).
		Find(&donations).Error
	return donations, err
}

func (r *DonationRepository) Update(donation *models.Donation) error {
	return r.db.Save(donation).Error
}

func (r *DonationRepository) UpdatePaymentStatus(id uuid.UUID, status models.PaymentStatus) error {
	updates := map[string]interface{}{
		"payment_status": status,
	}
	if status == models.PaymentStatusPaid {
		now := time.Now()
		updates["paid_at"] = &now
	}
	return r.db.Model(&models.Donation{}).Where("id = ?", id).Updates(updates).Error
}

// Statistics
type DonationStats struct {
	TotalAmount     int64 `json:"total_amount"`
	TotalDonations  int64 `json:"total_donations"`
	TotalSupporters int64 `json:"total_supporters"`
}

func (r *DonationRepository) GetStats(creatorID uuid.UUID) (*DonationStats, error) {
	var stats DonationStats

	// Total amount and count
	r.db.Model(&models.Donation{}).
		Where("creator_id = ? AND payment_status = ?", creatorID, models.PaymentStatusPaid).
		Select("COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as total_donations").
		Scan(&stats)

	// Unique supporters
	r.db.Model(&models.Donation{}).
		Where("creator_id = ? AND payment_status = ?", creatorID, models.PaymentStatusPaid).
		Distinct("buyer_email").
		Count(&stats.TotalSupporters)

	return &stats, nil
}

func (r *DonationRepository) GetStatsByPeriod(creatorID uuid.UUID, from, to time.Time) (*DonationStats, error) {
	var stats DonationStats

	r.db.Model(&models.Donation{}).
		Where("creator_id = ? AND payment_status = ? AND created_at BETWEEN ? AND ?",
			creatorID, models.PaymentStatusPaid, from, to).
		Select("COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as total_donations").
		Scan(&stats)

	return &stats, nil
}

// For chart data
type DailyStats struct {
	Date   string `json:"date"`
	Amount int64  `json:"amount"`
	Count  int64  `json:"count"`
}

func (r *DonationRepository) GetDailyStats(creatorID uuid.UUID, days int) ([]DailyStats, error) {
	var stats []DailyStats

	r.db.Model(&models.Donation{}).
		Where("creator_id = ? AND payment_status = ? AND created_at >= ?",
			creatorID, models.PaymentStatusPaid, time.Now().AddDate(0, 0, -days)).
		Select("DATE(created_at) as date, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count").
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&stats)

	return stats, nil
}
