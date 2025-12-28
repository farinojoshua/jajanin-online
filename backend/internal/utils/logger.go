package utils

import (
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

var Log zerolog.Logger

// InitLogger initializes the global logger
func InitLogger(env string) {
	if env == "production" {
		// JSON format for production (machine readable)
		zerolog.TimeFieldFormat = time.RFC3339
		Log = zerolog.New(os.Stdout).
			With().
			Timestamp().
			Logger()
	} else {
		// Pretty console output for development
		output := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05",
		}
		Log = zerolog.New(output).
			With().
			Timestamp().
			Logger()
	}
}

// WithRequestID returns a logger with request ID
func WithRequestID(requestID string) zerolog.Logger {
	return Log.With().Str("req", requestID).Logger()
}

// RequestLogger provides structured logging with request context
type RequestLogger struct {
	zerolog.Logger
	RequestID string
}

// NewRequestLogger creates a new request logger with request ID
func NewRequestLogger(requestID string) *RequestLogger {
	return &RequestLogger{
		Logger:    WithRequestID(requestID),
		RequestID: requestID,
	}
}

// GetLoggerFromContext retrieves logger from gin context
func GetLoggerFromContext(c *gin.Context) *RequestLogger {
	if logger, exists := c.Get("logger"); exists {
		if l, ok := logger.(*RequestLogger); ok {
			return l
		}
	}
	if requestID, exists := c.Get("request_id"); exists {
		rid := requestID.(string)
		if len(rid) > 8 {
			rid = rid[:8]
		}
		return NewRequestLogger(rid)
	}
	return &RequestLogger{Logger: Log, RequestID: ""}
}

// LogError logs an error with context (use this in handlers/services)
func (l *RequestLogger) LogError(location string, err error, msg string) {
	l.Error().Str("at", location).Err(err).Msg(msg)
}

// LogWarn logs a warning with context
func (l *RequestLogger) LogWarn(location string, msg string) {
	l.Warn().Str("at", location).Msg(msg)
}

// LogExternalAPI logs external API calls
func (l *RequestLogger) LogExternalAPI(service, method, url string) {
	l.Info().Str("api", service).Str("method", method).Str("url", url).Msg("Calling external API")
}

// LogExternalAPIResult logs external API response
func (l *RequestLogger) LogExternalAPIResult(service string, status int, duration time.Duration) {
	l.Info().Str("api", service).Int("status", status).Dur("took", duration).Msg("API response")
}

// Legacy helpers
func LogInfo(msg string) {
	Log.Info().Msg(msg)
}

func LogError(msg string, err error) {
	Log.Error().Err(err).Msg(msg)
}

func LogFatal(msg string, err error) {
	Log.Fatal().Err(err).Msg(msg)
}

func LogDebug(msg string) {
	Log.Debug().Msg(msg)
}

func LogWarn(msg string) {
	Log.Warn().Msg(msg)
}
