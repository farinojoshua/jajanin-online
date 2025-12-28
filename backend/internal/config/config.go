package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port string
	Env  string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// JWT
	JWTSecret      string
	JWTExpiryHours int

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string

	// Paylabs
	PaylabsMerchantID string
	PaylabsPrivateKey string
	PaylabsAPIURL     string

	// URLs
	FrontendURL string
	AppURL      string
}

var AppConfig *Config

func LoadConfig() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))

	// Load Paylabs private key - either from file or directly from env
	paylabsPrivateKey := getEnv("PAYLABS_PRIVATE_KEY", "")
	if privateKeyFile := getEnv("PAYLABS_PRIVATE_KEY_FILE", ""); privateKeyFile != "" {
		if keyData, err := os.ReadFile(privateKeyFile); err == nil {
			paylabsPrivateKey = strings.TrimSpace(string(keyData))
			log.Printf("Loaded Paylabs private key from file: %s", privateKeyFile)
		} else {
			log.Printf("Warning: Failed to read Paylabs private key file: %v", err)
		}
	}

	AppConfig = &Config{
		// Server
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("ENV", "development"),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "jajanin_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		// JWT
		JWTSecret:      getEnv("JWT_SECRET", "default_secret_change_this"),
		JWTExpiryHours: jwtExpiry,

		// Google OAuth
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),

		// Paylabs
		PaylabsMerchantID: getEnv("PAYLABS_MERCHANT_ID", ""),
		PaylabsPrivateKey: paylabsPrivateKey,
		PaylabsAPIURL:     getEnv("PAYLABS_API_URL", "https://sit-api.paylabs.co.id"),

		// URLs
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		AppURL:      getEnv("APP_URL", "http://localhost:8080"),
	}

	return AppConfig
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) GetDSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode
}
