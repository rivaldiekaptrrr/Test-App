package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL       string
	JWTSecret         string
	Port              string
	StorageBasePath   string
	AllowedOrigins    string
	EnableFaceDetection bool
	AIAPIKey          string
}

var AppConfig *Config

// LoadConfig loads environment variables and initializes the config
func LoadConfig() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	AppConfig = &Config{
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		Port:              getEnv("PORT", "8080"),
		StorageBasePath:   getEnv("STORAGE_BASE_PATH", "./uploads"),
		AllowedOrigins:    getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		EnableFaceDetection: getEnv("ENABLE_FACE_DETECTION", "false") == "true",
		AIAPIKey:          getEnv("AI_API_KEY", ""),
	}

	return AppConfig
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
