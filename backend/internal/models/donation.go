package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentStatusPending PaymentStatus = "pending"
	PaymentStatusPaid    PaymentStatus = "paid"
	PaymentStatusFailed  PaymentStatus = "failed"
	PaymentStatusExpired PaymentStatus = "expired"
)

type Donation struct {
	ID            uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CreatorID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"creator_id"`
	ProductID     *uuid.UUID    `gorm:"type:uuid;index" json:"product_id,omitempty"`
	BuyerID       *uuid.UUID    `gorm:"type:uuid;index" json:"buyer_id,omitempty"`
	BuyerName     string        `gorm:"" json:"buyer_name"`
	BuyerEmail    string        `gorm:"" json:"buyer_email"`
	Amount        int64         `gorm:"not null" json:"amount"`
	Quantity      int           `gorm:"default:1" json:"quantity"`
	Message       string        `gorm:"type:text" json:"message"`
	PaymentID     string        `gorm:"" json:"payment_id,omitempty"`
	PaymentStatus PaymentStatus `gorm:"default:pending" json:"payment_status"`
	PaymentMethod string        `gorm:"default:qris" json:"payment_method"` // qris, gopay, dana, shopee, ovo, linkaja
	ProductName   string        `gorm:"" json:"product_name,omitempty"`     // Denormalized for history
	ProductEmoji  string        `gorm:"" json:"product_emoji,omitempty"`    // Denormalized for history
	CreatedAt     time.Time     `gorm:"autoCreateTime" json:"created_at"`
	PaidAt        *time.Time    `gorm:"" json:"paid_at,omitempty"`

	// Relations
	Creator User       `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`
	Product *QuickItem `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Buyer   *User      `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
}

// BeforeCreate hook to generate UUID
func (d *Donation) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// DonationResponse for API responses
type DonationResponse struct {
	ID            uuid.UUID     `json:"id"`
	ProductID     *uuid.UUID    `json:"product_id,omitempty"`
	BuyerName     string        `json:"buyer_name"`
	Amount        int64         `json:"amount"`
	Quantity      int           `json:"quantity"`
	Message       string        `json:"message"`
	PaymentStatus PaymentStatus `json:"payment_status"`
	CreatedAt     time.Time     `json:"created_at"`
}

func (d *Donation) ToResponse() DonationResponse {
	return DonationResponse{
		ID:            d.ID,
		ProductID:     d.ProductID,
		BuyerName:     d.BuyerName,
		Amount:        d.Amount,
		Quantity:      d.Quantity,
		Message:       d.Message,
		PaymentStatus: d.PaymentStatus,
		CreatedAt:     d.CreatedAt,
	}
}
