package handler

import (
	"exam-system-backend/internal/model"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	startTime time.Time
}

// NewHealthHandler creates a new health handler
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
	}
}

// HealthCheck returns the service health status
// GET /api/v1/health
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	uptime := time.Since(h.startTime).Seconds()

	response := model.HealthResponse{
		Status:            "healthy",
		UptimeSeconds:     int64(uptime),
		StorageAccessible: true,   // TODO: Actually check storage
		DatabaseConnected: true,   // TODO: Actually check database
	}

	c.JSON(http.StatusOK, response)
}
