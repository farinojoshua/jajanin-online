package repository

import (
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

type QuickItemRepository struct {
	db *gorm.DB
}

func NewQuickItemRepository(db *gorm.DB) *QuickItemRepository {
	return &QuickItemRepository{db: db}
}

// Create creates a new quick item
func (r *QuickItemRepository) Create(item *models.QuickItem) error {
	return r.db.Create(item).Error
}

// GetByID retrieves a quick item by ID
func (r *QuickItemRepository) GetByID(id uuid.UUID) (*models.QuickItem, error) {
	var item models.QuickItem
	err := r.db.Where("id = ?", id).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// GetAll retrieves all quick items (for admin)
func (r *QuickItemRepository) GetAll() ([]models.QuickItem, error) {
	var items []models.QuickItem
	err := r.db.Order("sort_order ASC, created_at DESC").Find(&items).Error
	return items, err
}

// GetActive retrieves all active global quick items (for public)
func (r *QuickItemRepository) GetActive() ([]models.QuickItem, error) {
	var items []models.QuickItem
	err := r.db.Where("is_active = ?", true).Order("sort_order ASC, amount ASC").Find(&items).Error
	return items, err
}

// Update updates a quick item
func (r *QuickItemRepository) Update(item *models.QuickItem) error {
	return r.db.Save(item).Error
}

// Delete deletes a quick item
func (r *QuickItemRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.QuickItem{}, "id = ?", id).Error
}
