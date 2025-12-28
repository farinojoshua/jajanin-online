package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Register(&input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("AuthHandler.Register", err, "Registration failed")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Registration successful", resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Login(&input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogWarn("AuthHandler.Login", "Login failed: "+err.Error())
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Login successful", resp)
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var input services.GoogleAuthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.GoogleAuth(&input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("AuthHandler.GoogleAuth", err, "Google auth failed")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Authentication successful", resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	user, err := h.authService.GetCurrentUser(userID.(uuid.UUID))
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.Success(c, http.StatusOK, "", user)
}
