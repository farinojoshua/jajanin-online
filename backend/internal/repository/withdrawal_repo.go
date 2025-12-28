package repository

import (
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

type WithdrawalRepository struct {
	db *gorm.DB
}

func NewWithdrawalRepository(db *gorm.DB) *WithdrawalRepository {
	return &WithdrawalRepository{db: db}
}

func (r *WithdrawalRepository) Create(withdrawal *models.Withdrawal) error {
	return r.db.Create(withdrawal).Error
}

func (r *WithdrawalRepository) FindByID(id uuid.UUID) (*models.Withdrawal, error) {
	var withdrawal models.Withdrawal
	err := r.db.First(&withdrawal, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &withdrawal, nil
}

func (r *WithdrawalRepository) FindByUserID(userID uuid.UUID, limit, offset int) ([]models.Withdrawal, error) {
	var withdrawals []models.Withdrawal
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&withdrawals).Error
	return withdrawals, err
}

func (r *WithdrawalRepository) Update(withdrawal *models.Withdrawal) error {
	return r.db.Save(withdrawal).Error
}

func (r *WithdrawalRepository) GetPendingTotal(userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.Model(&models.Withdrawal{}).
		Where("user_id = ? AND status IN ?", userID,
			[]models.WithdrawalStatus{models.WithdrawalStatusPending, models.WithdrawalStatusProcessing}).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

func (r *WithdrawalRepository) GetCompletedTotal(userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.Model(&models.Withdrawal{}).
		Where("user_id = ? AND status = ?", userID, models.WithdrawalStatusCompleted).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}
