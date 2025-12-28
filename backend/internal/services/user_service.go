package services

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
)

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

type UpdateProfileInput struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Bio      string `json:"bio"`
	ImageURL string `json:"image_url"`
}

type UpdateBankInput struct {
	BankName    string `json:"bank_name" binding:"required"`
	BankAccount string `json:"bank_account" binding:"required"`
	BankHolder  string `json:"bank_holder" binding:"required"`
}

type UpdateSocialLinksInput struct {
	TwitterURL   string `json:"twitter_url"`
	InstagramURL string `json:"instagram_url"`
	YoutubeURL   string `json:"youtube_url"`
	WebsiteURL   string `json:"website_url"`
}

func (s *UserService) GetByUsername(username string) (*models.User, error) {
	return s.userRepo.FindByUsername(username)
}

func (s *UserService) GetByID(id uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *UserService) UpdateProfile(userID uuid.UUID, input *UpdateProfileInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Check if username is taken
	currentUsername := ""
	if user.Username != nil {
		currentUsername = *user.Username
	}
	if input.Username != "" && input.Username != currentUsername {
		if s.userRepo.CheckUsernameExists(input.Username, userID) {
			return nil, errors.New("username already taken")
		}
		user.Username = &input.Username
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Bio != "" {
		user.Bio = input.Bio
	}
	if input.ImageURL != "" {
		user.ImageURL = input.ImageURL
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update profile")
	}

	return user, nil
}

func (s *UserService) UpdateBank(userID uuid.UUID, input *UpdateBankInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.BankName = input.BankName
	user.BankAccount = input.BankAccount
	user.BankHolder = input.BankHolder

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update bank info")
	}

	return user, nil
}

func (s *UserService) UpdateSocialLinks(userID uuid.UUID, input *UpdateSocialLinksInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.TwitterURL = input.TwitterURL
	user.InstagramURL = input.InstagramURL
	user.YoutubeURL = input.YoutubeURL
	user.WebsiteURL = input.WebsiteURL

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update social links")
	}

	return user, nil
}

// UpdateAlertSettings updates the user's alert box settings
func (s *UserService) UpdateAlertSettings(userID uuid.UUID, settings *models.AlertSettings) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Convert settings to JSON
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return nil, errors.New("failed to encode settings")
	}
	user.AlertSettings = settingsJSON

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update alert settings")
	}

	return user, nil
}

// GetAlertSettings returns the user's alert box settings
func (s *UserService) GetAlertSettings(username string) (*models.AlertSettings, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, errors.New("user not found")
	}

	settings := models.DefaultAlertSettings()

	if len(user.AlertSettings) > 0 {
		if err := json.Unmarshal(user.AlertSettings, &settings); err != nil {
			// Return defaults if parsing fails
			return &settings, nil
		}
	}

	return &settings, nil
}

// GetByStreamKey returns a user by their stream key
func (s *UserService) GetByStreamKey(streamKey string) (*models.User, error) {
	return s.userRepo.FindByStreamKey(streamKey)
}

// RegenerateStreamKey generates a new stream key for the user
func (s *UserService) RegenerateStreamKey(userID uuid.UUID) (string, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return "", errors.New("user not found")
	}

	// Generate new unique stream key
	user.StreamKey = uuid.New().String()

	if err := s.userRepo.Update(user); err != nil {
		return "", errors.New("failed to regenerate stream key")
	}

	return user.StreamKey, nil
}

// GetAlertSettingsByStreamKey returns alert settings for a user by stream key
func (s *UserService) GetAlertSettingsByStreamKey(streamKey string) (*models.AlertSettings, error) {
	user, err := s.userRepo.FindByStreamKey(streamKey)
	if err != nil {
		return nil, errors.New("user not found")
	}

	settings := models.DefaultAlertSettings()

	if len(user.AlertSettings) > 0 {
		if err := json.Unmarshal(user.AlertSettings, &settings); err != nil {
			return &settings, nil
		}
	}

	return &settings, nil
}
