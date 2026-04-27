package handler

import (
	"exam-system-backend/internal/model"
	"exam-system-backend/internal/service"
	"exam-system-backend/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ConfigHandler handles configuration endpoints
type ConfigHandler struct {
	storageService *service.StorageService
}

// NewConfigHandler creates a new config handler
func NewConfigHandler(storageService *service.StorageService) *ConfigHandler {
	return &ConfigHandler{
		storageService: storageService,
	}
}

// SetStoragePath configures storage path for an organization
// POST /api/v1/config/storage
func (h *ConfigHandler) SetStoragePath(c *gin.Context) {
	var req model.StorageConfigRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	// Validate storage path
	if err := utils.ValidateStoragePath(req.StoragePath); err != nil {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Verify write access
	if err := h.storageService.VerifyWriteAccess(req.StoragePath); err != nil {
		c.JSON(http.StatusForbidden, model.StandardResponse{
			Success: false,
			Error:   "Cannot write to specified path: " + err.Error(),
		})
		return
	}

	// Here you would typically update the database
	// For now, we just return success
	// TODO: Update organization storage_path in database

	c.JSON(http.StatusOK, model.StandardResponse{
		Success: true,
		Message: "Storage path configured successfully",
		Data: gin.H{
			"writable": true,
			"path":     req.StoragePath,
		},
	})
}

// GetStorageConfig retrieves storage configuration
// GET /api/v1/config/storage/:organization_id
func (h *ConfigHandler) GetStorageConfig(c *gin.Context) {
	organizationID := c.Param("organization_id")

	// TODO: Fetch from database
	// For now, return current config

	totalGB, freeGB, _ := h.storageService.GetDiskSpace()
	usedGB := totalGB - freeGB

	response := model.StorageConfigResponse{
		OrganizationID: organizationID,
		StoragePath:    h.storageService.BaseStoragePath,
		Writable:       true,
		DiskSpace: model.DiskSpace{
			TotalGB: int(totalGB),
			UsedGB:  int(usedGB),
			FreeGB:  int(freeGB),
		},
	}

	c.JSON(http.StatusOK, response)
}
