package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// QuickItem represents a global jajan item (managed by admin)
type QuickItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Emoji     string    `gorm:"" json:"emoji"`
	Amount    int64     `gorm:"not null" json:"amount"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (q *QuickItem) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// QuickItemResponse for API responses
type QuickItemResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Emoji     string    `json:"emoji"`
	Amount    int64     `json:"amount"`
	SortOrder int       `json:"sort_order"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

func (q *QuickItem) ToResponse() QuickItemResponse {
	return QuickItemResponse{
		ID:        q.ID,
		Name:      q.Name,
		Emoji:     q.Emoji,
		Amount:    q.Amount,
		SortOrder: q.SortOrder,
		IsActive:  q.IsActive,
		CreatedAt: q.CreatedAt,
	}
}
