package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jajanin/backend/internal/config"
	"github.com/jajanin/backend/internal/database"
	"github.com/jajanin/backend/internal/handlers"
	"github.com/jajanin/backend/internal/middleware"
	"github.com/jajanin/backend/internal/repository"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize structured logger
	utils.InitLogger(cfg.Env)
	utils.Log.Info().Str("env", cfg.Env).Msg("Starting Jajanin API server")

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		utils.Log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	utils.Log.Info().Msg("Database connected successfully")

	// Run migrations
	if err := database.AutoMigrate(db); err != nil {
		utils.Log.Fatal().Err(err).Msg("Failed to run migrations")
	}
	utils.Log.Info().Msg("Database migrations completed")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	donationRepo := repository.NewDonationRepository(db)
	withdrawalRepo := repository.NewWithdrawalRepository(db)
	quickItemRepo := repository.NewQuickItemRepository(db)
	settingsRepo := repository.NewSystemSettingsRepository(db)

	// Initialize services
	paylabsService, err := services.NewPaylabsService(cfg)
	if err != nil {
		utils.Log.Fatal().Err(err).Msg("Failed to initialize Paylabs service")
	}
	alertService := services.NewAlertService()
	authService := services.NewAuthService(userRepo)
	userService := services.NewUserService(userRepo)
	donationService := services.NewDonationService(donationRepo, userRepo, paylabsService, alertService)
	withdrawalService := services.NewWithdrawalService(withdrawalRepo, donationRepo, userRepo)
	quickItemService := services.NewQuickItemService(quickItemRepo, userRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	donationHandler := handlers.NewDonationHandler(donationService)
	paymentHandler := handlers.NewPaymentHandler(paylabsService, donationService)
	withdrawalHandler := handlers.NewWithdrawalHandler(withdrawalService)
	overlayHandler := handlers.NewOverlayHandler(alertService, userService)
	quickItemHandler := handlers.NewQuickItemHandler(quickItemService)
	adminHandler := handlers.NewAdminHandler(db)

	// Setup Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global Middleware
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggingMiddleware())

	// Health check (no rate limit)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "jajanin-api", "version": "v1"})
	})

	// API v1 routes with general rate limiting
	api := r.Group("/api/v1")
	api.Use(middleware.GeneralRateLimitMiddleware())
	{
		// Auth routes with strict rate limit (for security on login/register)
		authStrict := api.Group("/auth")
		authStrict.Use(middleware.StrictRateLimitMiddleware())
		{
			authStrict.POST("/register", authHandler.Register)
			authStrict.POST("/login", authHandler.Login)
			authStrict.POST("/google", authHandler.GoogleAuth)
		}

		// Auth /me endpoint (separate, no strict rate limit - called frequently)
		api.GET("/auth/me", middleware.AuthMiddleware(), authHandler.Me)

		// User routes
		users := api.Group("/users")
		{
			users.GET("/:username", userHandler.GetProfile)
			users.GET("/:username/alert-settings", userHandler.GetAlertSettings) // Public for overlay
			users.PUT("/profile", middleware.AuthMiddleware(), userHandler.UpdateProfile)
			users.PUT("/bank", middleware.AuthMiddleware(), userHandler.UpdateBank)
			users.PUT("/social", middleware.AuthMiddleware(), userHandler.UpdateSocialLinks)
			users.PUT("/alert-settings", middleware.AuthMiddleware(), userHandler.UpdateAlertSettings)
			users.POST("/regenerate-stream-key", middleware.AuthMiddleware(), userHandler.RegenerateStreamKey)
		}

		// Quick Items routes (global products)
		products := api.Group("/products")
		{
			products.GET("", quickItemHandler.GetPublicItems) // Public - get all active products
			products.GET("/:id", quickItemHandler.GetByID)    // Public - get product by ID
		}

		// Donation routes
		donations := api.Group("/donations")
		{
			donations.POST("", middleware.OptionalAuth(), donationHandler.CreateDonation)
			donations.GET("", middleware.AuthMiddleware(), donationHandler.GetDonations)
			donations.GET("/stats", middleware.AuthMiddleware(), donationHandler.GetStats)
			donations.GET("/recent/:username", donationHandler.GetRecentDonations)
		}

		// Payment routes
		payment := api.Group("/payment")
		{
			payment.POST("/webhook", paymentHandler.PaylabsWebhook)
			payment.GET("/status/:orderID", paymentHandler.CheckPaymentStatus) // For status polling
			payment.POST("/cancel", paymentHandler.CancelPayment)              // Cancel pending order
		}

		// Withdrawal routes
		withdrawals := api.Group("/withdrawals")
		{
			withdrawals.Use(middleware.AuthMiddleware())
			withdrawals.POST("", withdrawalHandler.CreateWithdrawal)
			withdrawals.GET("", withdrawalHandler.GetWithdrawals)
			withdrawals.GET("/balance", withdrawalHandler.GetBalance)
		}

		// Admin routes (requires admin role)
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware())
		admin.Use(middleware.AdminMiddleware(db))
		{
			admin.GET("/stats", adminHandler.GetStats)
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/withdrawals", adminHandler.GetWithdrawals)
			admin.PUT("/withdrawals/:id/approve", adminHandler.ApproveWithdrawal)
			admin.PUT("/withdrawals/:id/reject", adminHandler.RejectWithdrawal)
			admin.PUT("/withdrawals/:id/complete", adminHandler.CompleteWithdrawal)

			// Admin product management
			admin.GET("/products", quickItemHandler.GetAll)
			admin.POST("/products", quickItemHandler.Create)
			admin.PUT("/products/:id", quickItemHandler.Update)
			admin.DELETE("/products/:id", quickItemHandler.Delete)

			// Admin settings
			admin.GET("/settings", adminHandler.GetSettings)
			admin.PUT("/settings", adminHandler.UpdateSettings)
		}

		// Public config (for frontend to get admin fee percentage)
		api.GET("/config", func(c *gin.Context) {
			feePercent, _ := settingsRepo.GetAdminFeePercent()
			utils.Success(c, http.StatusOK, "", gin.H{
				"admin_fee_percent": feePercent,
			})
		})
	}

	// Overlay routes (public, for OBS browser source)
	overlay := r.Group("/overlay")
	{
		overlay.GET("/alert/:streamKey", overlayHandler.AlertStream)
		overlay.POST("/test/:streamKey", overlayHandler.TestAlert)
		overlay.GET("/settings/:streamKey", userHandler.GetAlertSettingsByStreamKey) // Get settings by stream key
	}

	// Start server
	addr := ":" + cfg.Port
	utils.Log.Info().
		Str("address", addr).
		Str("env", cfg.Env).
		Msg("🚀 Jajanin API server starting")

	if err := r.Run(addr); err != nil {
		utils.Log.Fatal().Err(err).Msg("Failed to start server")
	}
}
