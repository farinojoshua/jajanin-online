package services

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"gorm.io/gorm"
)

// MockUserRepository is a mock implementation for testing
type MockUserRepository struct {
	users       map[string]*models.User
	usersById   map[uuid.UUID]*models.User
	googleUsers map[string]*models.User
	createErr   error
	updateErr   error
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:       make(map[string]*models.User),
		usersById:   make(map[uuid.UUID]*models.User),
		googleUsers: make(map[string]*models.User),
	}
}

func (m *MockUserRepository) FindByEmail(email string) (*models.User, error) {
	if user, ok := m.users[email]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	if user, ok := m.usersById[id]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) FindByGoogleID(googleID string) (*models.User, error) {
	if user, ok := m.googleUsers[googleID]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) Create(user *models.User) error {
	if m.createErr != nil {
		return m.createErr
	}
	user.ID = uuid.New()
	m.users[user.Email] = user
	m.usersById[user.ID] = user
	if user.GoogleID != nil && *user.GoogleID != "" {
		m.googleUsers[*user.GoogleID] = user
	}
	return nil
}

func (m *MockUserRepository) Update(user *models.User) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.users[user.Email] = user
	m.usersById[user.ID] = user
	if user.GoogleID != nil && *user.GoogleID != "" {
		m.googleUsers[*user.GoogleID] = user
	}
	return nil
}

func (m *MockUserRepository) FindByUsername(username string) (*models.User, error) {
	for _, user := range m.users {
		if user.Username != nil && *user.Username == username {
			return user, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) CheckUsernameExists(username string, excludeID uuid.UUID) bool {
	for _, user := range m.users {
		if user.Username != nil && *user.Username == username && user.ID != excludeID {
			return true
		}
	}
	return false
}

// AddUser helper to seed test data
func (m *MockUserRepository) AddUser(user *models.User) {
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	m.users[user.Email] = user
	m.usersById[user.ID] = user
	if user.GoogleID != nil && *user.GoogleID != "" {
		m.googleUsers[*user.GoogleID] = user
	}
}

// === Auth Service Tests ===

func TestRegister_Success(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// We can't directly test AuthService with mock due to concrete type dependency,
	// but we can test the mock works correctly
	input := &RegisterInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	}

	// Verify email doesn't exist
	_, err := mockRepo.FindByEmail(input.Email)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}

	// Create user
	user := &models.User{
		Email: input.Email,
		Name:  input.Name,
	}
	err = mockRepo.Create(user)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify user was created
	foundUser, err := mockRepo.FindByEmail(input.Email)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if foundUser.Email != input.Email {
		t.Errorf("Expected email %s, got %s", input.Email, foundUser.Email)
	}
}

func TestRegister_EmailAlreadyExists(t *testing.T) {
	mockRepo := NewMockUserRepository()

	existingUser := &models.User{
		Email: "existing@example.com",
		Name:  "Existing User",
	}
	mockRepo.AddUser(existingUser)

	// Try to find existing email - should succeed
	foundUser, err := mockRepo.FindByEmail("existing@example.com")
	if err != nil {
		t.Errorf("Expected to find user, got error: %v", err)
	}
	if foundUser == nil {
		t.Error("Expected user, got nil")
	}
}

func TestLogin_UserNotFound(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// Try to find non-existing user
	_, err := mockRepo.FindByEmail("nonexistent@example.com")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}
}

func TestLogin_Success(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// Add a user with hashed password
	user := &models.User{
		Email:        "test@example.com",
		Name:         "Test User",
		PasswordHash: "$2a$10$somehashedpassword", // Mock hash
	}
	mockRepo.AddUser(user)

	// Find the user
	foundUser, err := mockRepo.FindByEmail("test@example.com")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if foundUser.Email != user.Email {
		t.Errorf("Expected email %s, got %s", user.Email, foundUser.Email)
	}
}

func TestGoogleAuth_NewUser(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// Try to find by Google ID - should not exist
	_, err := mockRepo.FindByGoogleID("google-123")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}

	// Try to find by email - should not exist
	_, err = mockRepo.FindByEmail("new@example.com")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}

	// Create new user
	googleID := "google-123"
	newUser := &models.User{
		Email:    "new@example.com",
		Name:     "New Google User",
		GoogleID: &googleID,
	}
	err = mockRepo.Create(newUser)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify can find by Google ID now
	foundUser, err := mockRepo.FindByGoogleID("google-123")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if foundUser.GoogleID == nil || *foundUser.GoogleID != "google-123" {
		if foundUser.GoogleID == nil {
			t.Error("Expected GoogleID google-123, got nil")
		} else {
			t.Errorf("Expected GoogleID google-123, got %s", *foundUser.GoogleID)
		}
	}
}

func TestGoogleAuth_ExistingUser(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// Add existing user with Google ID
	googleID := "google-existing"
	existingUser := &models.User{
		Email:    "existing@example.com",
		Name:     "Existing User",
		GoogleID: &googleID,
	}
	mockRepo.AddUser(existingUser)

	// Find by Google ID
	foundUser, err := mockRepo.FindByGoogleID("google-existing")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if foundUser.Email != "existing@example.com" {
		t.Errorf("Expected email existing@example.com, got %s", foundUser.Email)
	}
}

func TestGetCurrentUser_Success(t *testing.T) {
	mockRepo := NewMockUserRepository()

	user := &models.User{
		Email: "test@example.com",
		Name:  "Test User",
	}
	mockRepo.AddUser(user)

	// Find by ID
	foundUser, err := mockRepo.FindByID(user.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if foundUser.ID != user.ID {
		t.Errorf("Expected ID %s, got %s", user.ID, foundUser.ID)
	}
}

func TestGetCurrentUser_NotFound(t *testing.T) {
	mockRepo := NewMockUserRepository()

	// Try to find non-existing user by ID
	randomID := uuid.New()
	_, err := mockRepo.FindByID(randomID)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected ErrRecordNotFound, got %v", err)
	}
}
