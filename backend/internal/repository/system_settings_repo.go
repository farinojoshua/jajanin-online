package repository

import (
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

type SystemSettingsRepository struct {
	db *gorm.DB
}

func NewSystemSettingsRepository(db *gorm.DB) *SystemSettingsRepository {
	return &SystemSettingsRepository{db: db}
}

// GetSettings retrieves the singleton settings row, creating default if not exists
func (r *SystemSettingsRepository) GetSettings() (*models.SystemSettings, error) {
	var settings models.SystemSettings

	result := r.db.First(&settings)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create default settings
			settings = models.SystemSettings{
				ID:              1,
				AdminFeePercent: 0.5, // Default 0.5%
			}
			if err := r.db.Create(&settings).Error; err != nil {
				return nil, err
			}
			return &settings, nil
		}
		return nil, result.Error
	}

	return &settings, nil
}

// UpdateSettings updates the system settings
func (r *SystemSettingsRepository) UpdateSettings(settings *models.SystemSettings) error {
	// Ensure we're always updating ID 1 (singleton)
	settings.ID = 1
	return r.db.Save(settings).Error
}

// GetAdminFeePercent returns just the admin fee percentage
func (r *SystemSettingsRepository) GetAdminFeePercent() (float64, error) {
	settings, err := r.GetSettings()
	if err != nil {
		return 0.5, err // Return default on error
	}
	return settings.AdminFeePercent, nil
}
