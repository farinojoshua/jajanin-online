package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userService.GetByUsername(username)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.Success(c, http.StatusOK, "", user.PublicProfile())
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := h.userService.UpdateProfile(userID.(uuid.UUID), &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("UserHandler.UpdateProfile", err, "Failed to update")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Profile updated", user)
}

func (h *UserHandler) UpdateBank(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.UpdateBankInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := h.userService.UpdateBank(userID.(uuid.UUID), &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("UserHandler.UpdateBank", err, "Failed to update")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Bank information updated", user)
}

func (h *UserHandler) UpdateSocialLinks(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.UpdateSocialLinksInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := h.userService.UpdateSocialLinks(userID.(uuid.UUID), &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("UserHandler.UpdateSocialLinks", err, "Failed to update")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Social links updated", user)
}

func (h *UserHandler) UpdateAlertSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input models.AlertSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := h.userService.UpdateAlertSettings(userID.(uuid.UUID), &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("UserHandler.UpdateAlertSettings", err, "Failed to update")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Alert settings updated", user)
}

func (h *UserHandler) GetAlertSettings(c *gin.Context) {
	username := c.Param("username")

	settings, err := h.userService.GetAlertSettings(username)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.Success(c, http.StatusOK, "", settings)
}

// RegenerateStreamKey generates a new stream key for the authenticated user
func (h *UserHandler) RegenerateStreamKey(c *gin.Context) {
	userID, _ := c.Get("user_id")

	newKey, err := h.userService.RegenerateStreamKey(userID.(uuid.UUID))
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("UserHandler.RegenerateStreamKey", err, "Failed to regenerate")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Stream key regenerated", gin.H{"stream_key": newKey})
}

// GetAlertSettingsByStreamKey returns alert settings for overlay by stream key (public)
func (h *UserHandler) GetAlertSettingsByStreamKey(c *gin.Context) {
	streamKey := c.Param("streamKey")

	settings, err := h.userService.GetAlertSettingsByStreamKey(streamKey)
	if err != nil {
		utils.NotFound(c, "Invalid stream key")
		return
	}

	utils.Success(c, http.StatusOK, "", settings)
}
