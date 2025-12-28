package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"" json:"-"`
	Name         string    `gorm:"" json:"name"`
	Username     *string   `gorm:"uniqueIndex" json:"username"`
	ImageURL     string    `gorm:"" json:"image_url"`
	Bio          string    `gorm:"type:text" json:"bio"`
	GoogleID     *string   `gorm:"uniqueIndex" json:"-"`
	Role         string    `gorm:"default:'user'" json:"role"` // "user" or "admin"
	BankName     string    `gorm:"" json:"bank_name,omitempty"`
	BankAccount  string    `gorm:"" json:"bank_account,omitempty"`
	BankHolder   string    `gorm:"" json:"bank_holder,omitempty"`

	// Social Links
	TwitterURL   string `gorm:"" json:"twitter_url,omitempty"`
	InstagramURL string `gorm:"" json:"instagram_url,omitempty"`
	YoutubeURL   string `gorm:"" json:"youtube_url,omitempty"`
	WebsiteURL   string `gorm:"" json:"website_url,omitempty"`

	// Alert Box Settings (stored as JSON)
	AlertSettings datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"alert_settings"`

	// Stream Key for overlay authentication (replaces username in overlay URLs)
	StreamKey string `gorm:"uniqueIndex" json:"stream_key"`

	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Donations   []Donation   `gorm:"foreignKey:CreatorID" json:"-"`
	Purchases   []Donation   `gorm:"foreignKey:BuyerID" json:"-"`
	Withdrawals []Withdrawal `gorm:"foreignKey:UserID" json:"-"`
}

// IsAdmin returns true if user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}

// PublicProfile returns a safe version of user for public display
func (u *User) PublicProfile() map[string]interface{} {
	return map[string]interface{}{
		"id":            u.ID,
		"username":      u.Username,
		"name":          u.Name,
		"bio":           u.Bio,
		"image_url":     u.ImageURL,
		"twitter_url":   u.TwitterURL,
		"instagram_url": u.InstagramURL,
		"youtube_url":   u.YoutubeURL,
		"website_url":   u.WebsiteURL,
	}
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
