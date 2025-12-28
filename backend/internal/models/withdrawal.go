package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WithdrawalStatus string

const (
	WithdrawalStatusPending    WithdrawalStatus = "pending"
	WithdrawalStatusProcessing WithdrawalStatus = "processing"
	WithdrawalStatusCompleted  WithdrawalStatus = "completed"
	WithdrawalStatusRejected   WithdrawalStatus = "rejected"
)

type Withdrawal struct {
	ID          uuid.UUID        `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID        `gorm:"type:uuid;not null;index" json:"user_id"`
	Amount      int64            `gorm:"not null" json:"amount"`
	Status      WithdrawalStatus `gorm:"default:pending" json:"status"`
	BankName    string           `gorm:"not null" json:"bank_name"`
	BankAccount string           `gorm:"not null" json:"bank_account"`
	BankHolder  string           `gorm:"not null" json:"bank_holder"`
	Notes       string           `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt   time.Time        `gorm:"autoCreateTime" json:"created_at"`
	ProcessedAt *time.Time       `gorm:"" json:"processed_at,omitempty"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// BeforeCreate hook to generate UUID
func (w *Withdrawal) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
