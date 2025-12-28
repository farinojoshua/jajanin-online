package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
)

type WithdrawalService struct {
	withdrawalRepo *repository.WithdrawalRepository
	donationRepo   *repository.DonationRepository
	userRepo       *repository.UserRepository
}

func NewWithdrawalService(
	withdrawalRepo *repository.WithdrawalRepository,
	donationRepo *repository.DonationRepository,
	userRepo *repository.UserRepository,
) *WithdrawalService {
	return &WithdrawalService{
		withdrawalRepo: withdrawalRepo,
		donationRepo:   donationRepo,
		userRepo:       userRepo,
	}
}

type CreateWithdrawalInput struct {
	Amount int64 `json:"amount" binding:"required,min=50000"`
}

func (s *WithdrawalService) CreateWithdrawal(userID uuid.UUID, input *CreateWithdrawalInput) (*models.Withdrawal, error) {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Check if bank info is set
	if user.BankName == "" || user.BankAccount == "" || user.BankHolder == "" {
		return nil, errors.New("please set your bank information first")
	}

	// Get available balance
	stats, err := s.donationRepo.GetStats(userID)
	if err != nil {
		return nil, errors.New("failed to get balance")
	}

	// Get pending withdrawals
	pendingTotal, err := s.withdrawalRepo.GetPendingTotal(userID)
	if err != nil {
		return nil, errors.New("failed to check pending withdrawals")
	}

	// Calculate available balance
	availableBalance := stats.TotalAmount - pendingTotal
	if input.Amount > availableBalance {
		return nil, errors.New("insufficient balance")
	}

	// Create withdrawal
	withdrawal := &models.Withdrawal{
		UserID:      userID,
		Amount:      input.Amount,
		Status:      models.WithdrawalStatusPending,
		BankName:    user.BankName,
		BankAccount: user.BankAccount,
		BankHolder:  user.BankHolder,
	}

	if err := s.withdrawalRepo.Create(withdrawal); err != nil {
		return nil, errors.New("failed to create withdrawal request")
	}

	return withdrawal, nil
}

func (s *WithdrawalService) GetWithdrawals(userID uuid.UUID, page, limit int) ([]models.Withdrawal, error) {
	offset := (page - 1) * limit
	return s.withdrawalRepo.FindByUserID(userID, limit, offset)
}

func (s *WithdrawalService) GetBalance(userID uuid.UUID) (map[string]int64, error) {
	stats, err := s.donationRepo.GetStats(userID)
	if err != nil {
		return nil, err
	}

	pendingTotal, err := s.withdrawalRepo.GetPendingTotal(userID)
	if err != nil {
		return nil, err
	}

	completedTotal, err := s.withdrawalRepo.GetCompletedTotal(userID)
	if err != nil {
		return nil, err
	}

	return map[string]int64{
		"total_earned":        stats.TotalAmount,
		"total_withdrawn":     completedTotal,
		"pending_withdrawals": pendingTotal,
		"available_balance":   stats.TotalAmount - pendingTotal - completedTotal,
	}, nil
}
