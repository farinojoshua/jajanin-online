package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/utils"
	"gorm.io/gorm"
)

// AdminMiddleware checks if the authenticated user has admin role
func AdminMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by AuthMiddleware)
		userID, exists := c.Get("user_id")
		if !exists {
			utils.Forbidden(c, "Access denied")
			c.Abort()
			return
		}

		// Fetch user from database to check role
		var user models.User
		if err := db.First(&user, "id = ?", userID.(uuid.UUID)).Error; err != nil {
			utils.Forbidden(c, "User not found")
			c.Abort()
			return
		}

		// Check if user is admin
		if !user.IsAdmin() {
			utils.Forbidden(c, "Admin access required")
			c.Abort()
			return
		}

		// Set user in context for handler use
		c.Set("admin_user", user)
		c.Next()
	}
}
