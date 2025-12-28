package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/utils"
)

const RequestIDKey = "request_id"
const LoggerKey = "logger"

// LoggingMiddleware logs all incoming requests
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate short request ID
		fullID := uuid.New().String()
		shortID := fullID[:8]
		c.Set(RequestIDKey, fullID)
		c.Header("X-Request-ID", fullID)

		// Create logger
		logger := utils.NewRequestLogger(shortID)
		c.Set(LoggerKey, logger)

		// Timer
		start := time.Now()
		path := c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			path = path + "?" + c.Request.URL.RawQuery
		}

		// Process request
		c.Next()

		// Log result
		latency := time.Since(start)
		status := c.Writer.Status()

		// Choose log level
		logFn := logger.Info()
		statusIcon := "✓"
		if status >= 500 {
			logFn = logger.Error()
			statusIcon = "✗"
		} else if status >= 400 {
			logFn = logger.Warn()
			statusIcon = "!"
		}

		logFn.
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", status).
			Str("latency", formatLatency(latency)).
			Msg(fmt.Sprintf("%s %s", statusIcon, c.Request.Method))
	}
}

func formatLatency(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%dµs", d.Microseconds())
	} else if d < time.Second {
		return fmt.Sprintf("%dms", d.Milliseconds())
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}
