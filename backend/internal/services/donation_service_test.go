package services

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
	"gorm.io/gorm"
)

// MockDonationRepository is a mock implementation for testing
type MockDonationRepository struct {
	donations   map[uuid.UUID]*models.Donation
	byPaymentID map[string]*models.Donation
	createErr   error
	updateErr   error
}

func NewMockDonationRepository() *MockDonationRepository {
	return &MockDonationRepository{
		donations:   make(map[uuid.UUID]*models.Donation),
		byPaymentID: make(map[string]*models.Donation),
	}
}

func (m *MockDonationRepository) Create(donation *models.Donation) error {
	if m.createErr != nil {
		return m.createErr
	}
	donation.ID = uuid.New()
	donation.CreatedAt = time.Now()
	m.donations[donation.ID] = donation
	return nil
}

func (m *MockDonationRepository) FindByID(id uuid.UUID) (*models.Donation, error) {
	if donation, ok := m.donations[id]; ok {
		return donation, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockDonationRepository) FindByPaymentID(paymentID string) (*models.Donation, error) {
	if donation, ok := m.byPaymentID[paymentID]; ok {
		return donation, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockDonationRepository) FindByCreatorID(creatorID uuid.UUID, limit, offset int) ([]models.Donation, error) {
	var result []models.Donation
	for _, d := range m.donations {
		if d.CreatorID == creatorID && d.PaymentStatus == models.PaymentStatusPaid {
			result = append(result, *d)
		}
	}
	// Apply offset and limit
	if offset >= len(result) {
		return []models.Donation{}, nil
	}
	end := offset + limit
	if end > len(result) {
		end = len(result)
	}
	return result[offset:end], nil
}

func (m *MockDonationRepository) FindRecentByCreatorID(creatorID uuid.UUID, limit int) ([]models.Donation, error) {
	return m.FindByCreatorID(creatorID, limit, 0)
}

func (m *MockDonationRepository) Update(donation *models.Donation) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.donations[donation.ID] = donation
	if donation.PaymentID != "" {
		m.byPaymentID[donation.PaymentID] = donation
	}
	return nil
}

func (m *MockDonationRepository) UpdatePaymentStatus(id uuid.UUID, status models.PaymentStatus) error {
	if donation, ok := m.donations[id]; ok {
		donation.PaymentStatus = status
		if status == models.PaymentStatusPaid {
			now := time.Now()
			donation.PaidAt = &now
		}
		return nil
	}
	return gorm.ErrRecordNotFound
}

func (m *MockDonationRepository) GetStats(creatorID uuid.UUID) (*repository.DonationStats, error) {
	var totalAmount int64
	var totalDonations int64
	supporters := make(map[string]bool)

	for _, d := range m.donations {
		if d.CreatorID == creatorID && d.PaymentStatus == models.PaymentStatusPaid {
			totalAmount += d.Amount
			totalDonations++
			supporters[d.BuyerEmail] = true
		}
	}

	return &repository.DonationStats{
		TotalAmount:     totalAmount,
		TotalDonations:  totalDonations,
		TotalSupporters: int64(len(supporters)),
	}, nil
}

func (m *MockDonationRepository) GetStatsByPeriod(creatorID uuid.UUID, from, to time.Time) (*repository.DonationStats, error) {
	var totalAmount int64
	var totalDonations int64

	for _, d := range m.donations {
		if d.CreatorID == creatorID && d.PaymentStatus == models.PaymentStatusPaid {
			if d.CreatedAt.After(from) && d.CreatedAt.Before(to) {
				totalAmount += d.Amount
				totalDonations++
			}
		}
	}

	return &repository.DonationStats{
		TotalAmount:    totalAmount,
		TotalDonations: totalDonations,
	}, nil
}

func (m *MockDonationRepository) GetDailyStats(creatorID uuid.UUID, days int) ([]repository.DailyStats, error) {
	return []repository.DailyStats{}, nil
}

// AddDonation helper to seed test data
func (m *MockDonationRepository) AddDonation(donation *models.Donation) {
	if donation.ID == uuid.Nil {
		donation.ID = uuid.New()
	}
	m.donations[donation.ID] = donation
	if donation.PaymentID != "" {
		m.byPaymentID[donation.PaymentID] = donation
	}
}

// === Donation Service Tests ===

func TestCreateDonation_RepositoryInteraction(t *testing.T) {
	mockRepo := NewMockDonationRepository()
	mockUserRepo := NewMockUserRepository()

	// Add creator
	testUsername := "testcreator"
	creator := &models.User{
		Email:    "creator@example.com",
		Name:     "Test Creator",
		Username: &testUsername,
	}
	mockUserRepo.AddUser(creator)

	// Verify creator exists
	foundCreator, err := mockUserRepo.FindByUsername("testcreator")
	if err != nil {
		t.Fatalf("Expected to find creator, got error: %v", err)
	}

	// Create donation
	donation := &models.Donation{
		CreatorID:     foundCreator.ID,
		BuyerName:     "Supporter",
		BuyerEmail:    "supporter@example.com",
		Amount:        50000,
		Message:       "Keep up the good work!",
		PaymentStatus: models.PaymentStatusPending,
	}

	err = mockRepo.Create(donation)
	if err != nil {
		t.Fatalf("Expected no error creating donation, got: %v", err)
	}

	if donation.ID == uuid.Nil {
		t.Error("Expected donation to have ID assigned")
	}
}

func TestCreateDonation_CreatorNotFound(t *testing.T) {
	mockUserRepo := NewMockUserRepository()

	// Try to find non-existing creator
	_, err := mockUserRepo.FindByUsername("nonexistent")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}
}

func TestGetCreatorDonations_Success(t *testing.T) {
	mockRepo := NewMockDonationRepository()
	creatorID := uuid.New()

	// Add some donations
	for i := 0; i < 5; i++ {
		mockRepo.AddDonation(&models.Donation{
			CreatorID:     creatorID,
			BuyerName:     "Supporter",
			BuyerEmail:    "supporter@example.com",
			Amount:        10000,
			PaymentStatus: models.PaymentStatusPaid,
		})
	}

	// Get donations
	donations, err := mockRepo.FindByCreatorID(creatorID, 10, 0)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(donations) != 5 {
		t.Errorf("Expected 5 donations, got %d", len(donations))
	}
}

func TestGetCreatorDonations_Pagination(t *testing.T) {
	mockRepo := NewMockDonationRepository()
	creatorID := uuid.New()

	// Add 10 donations
	for i := 0; i < 10; i++ {
		mockRepo.AddDonation(&models.Donation{
			CreatorID:     creatorID,
			BuyerName:     "Supporter",
			BuyerEmail:    "supporter@example.com",
			Amount:        10000,
			PaymentStatus: models.PaymentStatusPaid,
		})
	}

	// Get first page
	page1, err := mockRepo.FindByCreatorID(creatorID, 5, 0)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}
	if len(page1) != 5 {
		t.Errorf("Expected 5 donations on page 1, got %d", len(page1))
	}

	// Get second page
	page2, err := mockRepo.FindByCreatorID(creatorID, 5, 5)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}
	if len(page2) != 5 {
		t.Errorf("Expected 5 donations on page 2, got %d", len(page2))
	}
}

func TestUpdatePaymentStatus_Success(t *testing.T) {
	mockRepo := NewMockDonationRepository()

	donation := &models.Donation{
		CreatorID:     uuid.New(),
		BuyerName:     "Supporter",
		BuyerEmail:    "supporter@example.com",
		Amount:        50000,
		PaymentStatus: models.PaymentStatusPending,
	}
	mockRepo.AddDonation(donation)

	// Update payment status
	err := mockRepo.UpdatePaymentStatus(donation.ID, models.PaymentStatusPaid)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify status updated
	updated, _ := mockRepo.FindByID(donation.ID)
	if updated.PaymentStatus != models.PaymentStatusPaid {
		t.Errorf("Expected status Paid, got %s", updated.PaymentStatus)
	}
	if updated.PaidAt == nil {
		t.Error("Expected PaidAt to be set")
	}
}

func TestUpdatePaymentStatus_NotFound(t *testing.T) {
	mockRepo := NewMockDonationRepository()

	// Try to update non-existing donation
	err := mockRepo.UpdatePaymentStatus(uuid.New(), models.PaymentStatusPaid)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}
}

func TestGetStats_Success(t *testing.T) {
	mockRepo := NewMockDonationRepository()
	creatorID := uuid.New()

	// Add paid donations
	mockRepo.AddDonation(&models.Donation{
		CreatorID:     creatorID,
		BuyerName:     "Supporter 1",
		BuyerEmail:    "supporter1@example.com",
		Amount:        50000,
		PaymentStatus: models.PaymentStatusPaid,
	})
	mockRepo.AddDonation(&models.Donation{
		CreatorID:     creatorID,
		BuyerName:     "Supporter 2",
		BuyerEmail:    "supporter2@example.com",
		Amount:        100000,
		PaymentStatus: models.PaymentStatusPaid,
	})
	// Add pending donation (should not count)
	mockRepo.AddDonation(&models.Donation{
		CreatorID:     creatorID,
		BuyerName:     "Supporter 3",
		BuyerEmail:    "supporter3@example.com",
		Amount:        25000,
		PaymentStatus: models.PaymentStatusPending,
	})

	stats, err := mockRepo.GetStats(creatorID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if stats.TotalAmount != 150000 {
		t.Errorf("Expected total amount 150000, got %d", stats.TotalAmount)
	}
	if stats.TotalDonations != 2 {
		t.Errorf("Expected 2 donations, got %d", stats.TotalDonations)
	}
	if stats.TotalSupporters != 2 {
		t.Errorf("Expected 2 supporters, got %d", stats.TotalSupporters)
	}
}

func TestGetStats_Empty(t *testing.T) {
	mockRepo := NewMockDonationRepository()
	creatorID := uuid.New()

	stats, err := mockRepo.GetStats(creatorID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if stats.TotalAmount != 0 {
		t.Errorf("Expected total amount 0, got %d", stats.TotalAmount)
	}
	if stats.TotalDonations != 0 {
		t.Errorf("Expected 0 donations, got %d", stats.TotalDonations)
	}
}
