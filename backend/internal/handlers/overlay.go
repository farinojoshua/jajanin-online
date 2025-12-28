package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type OverlayHandler struct {
	alertService *services.AlertService
	userService  *services.UserService
}

func NewOverlayHandler(alertService *services.AlertService, userService *services.UserService) *OverlayHandler {
	return &OverlayHandler{
		alertService: alertService,
		userService:  userService,
	}
}

func (h *OverlayHandler) AlertStream(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)
	streamKey := c.Param("streamKey")

	// Validate stream key and get user
	user, err := h.userService.GetByStreamKey(streamKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid stream key"})
		return
	}

	username := ""
	if user.Username != nil {
		username = *user.Username
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")

	alertChan := make(chan *services.AlertData, 10)
	// Register using user ID to ensure uniqueness
	userKey := user.ID.String()
	h.alertService.Register(userKey, alertChan)

	defer func() {
		h.alertService.Unregister(userKey, alertChan)
	}()

	c.SSEvent("connected", gin.H{"message": "Connected to alert stream", "username": username})
	c.Writer.Flush()

	log.Info().Str("user", username).Str("user_id", userKey).Msg("SSE client connected")

	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case alert, ok := <-alertChan:
			if !ok {
				return
			}
			data, _ := json.Marshal(alert)
			c.Writer.Write([]byte(fmt.Sprintf("event: alert\ndata: %s\n\n", data)))
			c.Writer.Flush()

		case <-heartbeat.C:
			c.Writer.Write([]byte(": heartbeat\n\n"))
			c.Writer.Flush()

		case <-c.Request.Context().Done():
			log.Info().Str("user", username).Msg("SSE client disconnected")
			return
		}
	}
}

func (h *OverlayHandler) TestAlert(c *gin.Context) {
	log := utils.GetLoggerFromContext(c)
	streamKey := c.Param("streamKey")

	// Validate stream key and get user
	user, err := h.userService.GetByStreamKey(streamKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid stream key"})
		return
	}

	username := ""
	if user.Username != nil {
		username = *user.Username
	}

	userKey := user.ID.String()

	alert := &services.AlertData{
		SupporterName: "Test User",
		Amount:        10000,
		Message:       "Ini adalah test alert! 🎉",
		CreatorName:   username,
	}

	h.alertService.Broadcast(log, userKey, alert)

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Test alert sent",
		"client_count": h.alertService.GetClientCount(userKey),
	})
}
