package main

import (
	"exam-system-backend/internal/config"
	"exam-system-backend/internal/handler"
	"exam-system-backend/internal/middleware"
	"exam-system-backend/internal/service"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{config.AppConfig.AllowedOrigins}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	router.Use(cors.New(corsConfig))

	// Initialize services
	storageService := service.NewStorageService()

	// Initialize handlers
	healthHandler := handler.NewHealthHandler()
	configHandler := handler.NewConfigHandler(storageService)
	proctoringHandler := handler.NewProctoringHandler(storageService)

	// Public routes
	router.GET("/health", healthHandler.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Health check (no auth required)
		v1.GET("/health", healthHandler.HealthCheck)

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Configuration management (admin only)
			configGroup := protected.Group("/config")
			configGroup.Use(middleware.AdminOnly())
			{
				configGroup.POST("/storage", configHandler.SetStoragePath)
				configGroup.GET("/storage/:organization_id", configHandler.GetStorageConfig)
			}

			// Proctoring endpoints
			proctoringGroup := protected.Group("/proctoring")
			{
				proctoringGroup.POST("/snapshot", proctoringHandler.UploadSnapshot)
				proctoringGroup.POST("/violation", proctoringHandler.LogViolation)
			}

			// File serving endpoints
			filesGroup := protected.Group("/files")
			{
				filesGroup.GET("/proctoring/:org_id/:exam_id/:user_id/:filename", 
					proctoringHandler.GetSnapshot)
			}
		}
	}

	// Start server
	port := config.AppConfig.Port
	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📁 Storage path: %s", config.AppConfig.StorageBasePath)
	log.Printf("🔐 Auth enabled: JWT validation")
	
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
