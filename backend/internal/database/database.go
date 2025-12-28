package database

import (
	"context"
	"errors"
	"time"

	"github.com/jajanin/backend/internal/config"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var DB *gorm.DB

// ZerologGormLogger is a custom GORM logger using zerolog
type ZerologGormLogger struct {
	SlowThreshold time.Duration
	LogLevel      gormlogger.LogLevel
}

func NewZerologGormLogger(level gormlogger.LogLevel) *ZerologGormLogger {
	return &ZerologGormLogger{
		SlowThreshold: 200 * time.Millisecond,
		LogLevel:      level,
	}
}

func (l *ZerologGormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	newLogger := *l
	newLogger.LogLevel = level
	return &newLogger
}

func (l *ZerologGormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Info {
		utils.Log.Info().Msgf(msg, data...)
	}
}

func (l *ZerologGormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Warn {
		utils.Log.Warn().Msgf(msg, data...)
	}
}

func (l *ZerologGormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Error {
		utils.Log.Error().Msgf(msg, data...)
	}
}

func (l *ZerologGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if l.LogLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()

	// Don't log "record not found" as it's a normal case
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		utils.Log.Error().
			Err(err).
			Str("layer", "database").
			Dur("duration", elapsed).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Database error")
		return
	}

	// Log slow queries as warnings
	if elapsed > l.SlowThreshold && l.SlowThreshold > 0 {
		utils.Log.Warn().
			Str("layer", "database").
			Dur("duration", elapsed).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Slow query detected")
		return
	}

	// Only log queries in debug level for development
	if l.LogLevel >= gormlogger.Info {
		utils.Log.Debug().
			Str("layer", "database").
			Dur("duration", elapsed).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Database query")
	}
}

func Connect(cfg *config.Config) (*gorm.DB, error) {
	var logLevel gormlogger.LogLevel
	if cfg.Env == "development" {
		logLevel = gormlogger.Warn // Only log warnings and errors, not every query
	} else {
		logLevel = gormlogger.Error // Only log actual errors in production
	}

	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: NewZerologGormLogger(logLevel),
	})
	if err != nil {
		return nil, err
	}

	DB = db
	utils.Log.Info().Msg("✅ Database connected successfully")
	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	utils.Log.Info().Msg("🔄 Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Donation{},
		&models.Withdrawal{},
		&models.QuickItem{},
		&models.SystemSettings{},
	)
	if err != nil {
		return err
	}

	utils.Log.Info().Msg("✅ Database migrations completed")
	return nil
}
