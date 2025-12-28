package repository

import (
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "username = ?", username).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByGoogleID(googleID string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "google_id = ?", googleID).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) CheckUsernameExists(username string, excludeID uuid.UUID) bool {
	var count int64
	r.db.Model(&models.User{}).Where("username = ? AND id != ?", username, excludeID).Count(&count)
	return count > 0
}

func (r *UserRepository) FindByStreamKey(streamKey string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "stream_key = ?", streamKey).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
