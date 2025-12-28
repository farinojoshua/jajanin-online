package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
	"github.com/jajanin/backend/internal/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Helper to safely dereference *string
func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (s *AuthService) Register(input *RegisterInput) (*AuthResponse, error) {
	// Check if email exists
	existingUser, err := s.userRepo.FindByEmail(input.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("failed to check email availability")
	}
	if existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Create user with auto-generated stream key
	user := &models.User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		Name:         input.Name,
		StreamKey:    uuid.New().String(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Email, derefString(user.Username))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) Login(input *LoginInput) (*AuthResponse, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, errors.New("failed to find user")
	}

	// Check password
	if !utils.CheckPassword(input.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Email, derefString(user.Username))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

type GoogleAuthInput struct {
	GoogleID string `json:"google_id" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
}

func (s *AuthService) GoogleAuth(input *GoogleAuthInput) (*AuthResponse, error) {
	// Try to find existing user by Google ID
	user, err := s.userRepo.FindByGoogleID(input.GoogleID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("failed to find user")
	}

	// If user exists, update their image URL from Google (in case it changed)
	if user != nil && input.ImageURL != "" && user.ImageURL != input.ImageURL {
		user.ImageURL = input.ImageURL
		_ = s.userRepo.Update(user) // Ignore error, not critical
	}

	// If user doesn't exist, create new one
	if user == nil {
		// Check if email is already used
		existingUser, findErr := s.userRepo.FindByEmail(input.Email)
		if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return nil, errors.New("failed to check email availability")
		}
		if existingUser != nil {
			// Link Google account to existing user
			existingUser.GoogleID = &input.GoogleID
			if existingUser.ImageURL == "" && input.ImageURL != "" {
				existingUser.ImageURL = input.ImageURL
			}
			// Generate stream key if not exists
			if existingUser.StreamKey == "" {
				existingUser.StreamKey = uuid.New().String()
			}
			if err := s.userRepo.Update(existingUser); err != nil {
				return nil, errors.New("failed to link Google account")
			}
			user = existingUser
		} else {
			// Create new user with stream key
			user = &models.User{
				Email:     input.Email,
				Name:      input.Name,
				GoogleID:  &input.GoogleID,
				ImageURL:  input.ImageURL,
				StreamKey: uuid.New().String(),
			}
			if err := s.userRepo.Create(user); err != nil {
				return nil, errors.New("failed to create user")
			}
		}
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Email, derefString(user.Username))
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) GetCurrentUser(userID uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	// Generate stream key for existing users who don't have one
	if user.StreamKey == "" {
		user.StreamKey = uuid.New().String()
		_ = s.userRepo.Update(user) // Ignore error, not critical
	}

	return user, nil
}
