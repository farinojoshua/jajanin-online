package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
)

const MaxGlobalProducts = 50

type QuickItemService struct {
	repo     *repository.QuickItemRepository
	userRepo *repository.UserRepository
}

func NewQuickItemService(repo *repository.QuickItemRepository, userRepo *repository.UserRepository) *QuickItemService {
	return &QuickItemService{repo: repo, userRepo: userRepo}
}

// CreateQuickItemInput is the input for creating a quick item (admin only)
type CreateQuickItemInput struct {
	Name      string `json:"name" binding:"required,min=1,max=50"`
	Emoji     string `json:"emoji" binding:"max=10"`
	Amount    int64  `json:"amount" binding:"required,min=1000"`
	SortOrder int    `json:"sort_order"`
}

// UpdateQuickItemInput is the input for updating a quick item (admin only)
type UpdateQuickItemInput struct {
	Name      *string `json:"name" binding:"omitempty,min=1,max=50"`
	Emoji     *string `json:"emoji" binding:"omitempty,max=10"`
	Amount    *int64  `json:"amount" binding:"omitempty,min=1000"`
	SortOrder *int    `json:"sort_order"`
	IsActive  *bool   `json:"is_active"`
}

// Create creates a new global quick item (admin only)
func (s *QuickItemService) Create(input *CreateQuickItemInput) (*models.QuickItemResponse, error) {
	// Validate amount
	if input.Amount < 1000 {
		return nil, errors.New("minimal amount Rp 1.000")
	}

	item := &models.QuickItem{
		Name:      input.Name,
		Emoji:     input.Emoji,
		Amount:    input.Amount,
		SortOrder: input.SortOrder,
		IsActive:  true,
	}

	if err := s.repo.Create(item); err != nil {
		return nil, err
	}

	response := item.ToResponse()
	return &response, nil
}

// GetAll retrieves all global quick items (for admin)
func (s *QuickItemService) GetAll() ([]models.QuickItemResponse, error) {
	items, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	var responses []models.QuickItemResponse
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}

	return responses, nil
}

// GetActive retrieves all active global quick items (for public)
func (s *QuickItemService) GetActive() ([]models.QuickItemResponse, error) {
	items, err := s.repo.GetActive()
	if err != nil {
		return nil, err
	}

	var responses []models.QuickItemResponse
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}

	return responses, nil
}

// GetByID retrieves a quick item by ID
func (s *QuickItemService) GetByID(id uuid.UUID) (*models.QuickItemResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	response := item.ToResponse()
	return &response, nil
}

// Update updates a quick item (admin only)
func (s *QuickItemService) Update(itemID uuid.UUID, input *UpdateQuickItemInput) (*models.QuickItemResponse, error) {
	item, err := s.repo.GetByID(itemID)
	if err != nil {
		return nil, errors.New("produk jajan tidak ditemukan")
	}

	// Update fields if provided
	if input.Name != nil {
		item.Name = *input.Name
	}
	if input.Emoji != nil {
		item.Emoji = *input.Emoji
	}
	if input.Amount != nil {
		if *input.Amount < 1000 {
			return nil, errors.New("minimal amount Rp 1.000")
		}
		item.Amount = *input.Amount
	}
	if input.SortOrder != nil {
		item.SortOrder = *input.SortOrder
	}
	if input.IsActive != nil {
		item.IsActive = *input.IsActive
	}

	if err := s.repo.Update(item); err != nil {
		return nil, err
	}

	response := item.ToResponse()
	return &response, nil
}

// Delete deletes a quick item (admin only)
func (s *QuickItemService) Delete(itemID uuid.UUID) error {
	_, err := s.repo.GetByID(itemID)
	if err != nil {
		return errors.New("produk jajan tidak ditemukan")
	}

	return s.repo.Delete(itemID)
}
