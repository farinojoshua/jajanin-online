package models

import (
	"time"
)

// SystemSettings stores platform-wide configuration
// Uses singleton pattern - only one row in the database
type SystemSettings struct {
	ID              uint      `gorm:"primarykey" json:"id"`
	AdminFeePercent float64   `gorm:"default:0.5" json:"admin_fee_percent"` // 0.5 = 0.5%
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name
func (SystemSettings) TableName() string {
	return "system_settings"
}
