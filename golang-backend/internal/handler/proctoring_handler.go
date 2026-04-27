package handler

import (
	"encoding/base64"
	"exam-system-backend/internal/model"
	"exam-system-backend/internal/service"
	"exam-system-backend/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProctoringHandler handles proctoring-related endpoints
type ProctoringHandler struct {
	storageService *service.StorageService
}

// NewProctoringHandler creates a new proctoring handler
func NewProctoringHandler(storageService *service.StorageService) *ProctoringHandler {
	return &ProctoringHandler{
		storageService: storageService,
	}
}

// UploadSnapshot handles camera snapshot uploads
// POST /api/v1/proctoring/snapshot
func (h *ProctoringHandler) UploadSnapshot(c *gin.Context) {
	var req model.SnapshotUploadRequest
	
	// Bind form data
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	// Get organization ID from context (set by auth middleware)
	orgID, exists := c.Get("org_id")
	if !exists {
		orgID = "default" // Fallback for testing
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, model.StandardResponse{
			Success: false,
			Error:   "User  ID not found in token",
		})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "No image file provided",
		})
		return
	}

	// Validate file size (max 5MB)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "File size exceeds 5MB limit",
		})
		return
	}

	// Validate file extension
	if !utils.ValidateFileExtension(file.Filename, []string{"jpg", "jpeg", "png", "webp"}) {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "Invalid file type. Allowed: jpg, jpeg, png, webp",
		})
		return
	}

	// Read file contents
	fileData, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.StandardResponse{
			Success: false,
			Error:   "Failed to read file",
		})
		return
	}
	defer fileData.Close()

	// Read file bytes
	buffer := make([]byte, file.Size)
	_, err = fileData.Read(buffer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.StandardResponse{
			Success: false,
			Error:   "Failed to read file data",
		})
		return
	}

	// Extract exam ID from session ID (you might want to query database for this)
	// For now, we'll use session_id as exam_id
	examID := req.SessionID

	// Save snapshot
	relativePath, err := h.storageService.SaveSnapshot(
		orgID.(string),
		examID,
		userID.(string),
		buffer,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, model.StandardResponse{
			Success: false,
			Error:   "Failed to save snapshot: " + err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, model.FileUploadResponse{
		Success:  true,
		FilePath: relativePath,
		SizeKB:   utils.GetFileSizeKB(file.Size),
	})
}

// LogViolation handles cheating violation logging
// POST /api/v1/proctoring/violation
func (h *ProctoringHandler) LogViolation(c *gin.Context) {
	var req model.ViolationLogRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.StandardResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	// Get organization and user info from context
	orgID, _ := c.Get("org_id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, model.StandardResponse{
			Success: false,
			Error:   "User ID not found in token",
		})
		return
	}

	var snapshotPath string

	// If snapshot is provided as base64, save it
	if req.Snapshot != "" {
		// Decode base64
		imageData, err := base64.StdEncoding.DecodeString(req.Snapshot)
		if err != nil {
			c.JSON(http.StatusBadRequest, model.StandardResponse{
				Success: false,
				Error:   "Invalid base64 image data",
			})
			return
		}

		// Save snapshot
		examID := req.SessionID // Simplified
		path, err := h.storageService.SaveSnapshot(
			orgID.(string),
			examID,
			userID.(string),
			imageData,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, model.StandardResponse{
				Success: false,
				Error:   "Failed to save violation snapshot",
			})
			return
		}
		snapshotPath = path
	}

	// Determine if auto-blocking should occur
	autoBlocked := false
	violationType := req.ViolationType

	// Auto-block rules
	switch violationType {
	case "multiple_faces":
		autoBlocked = true
	case "phone_detected":
		autoBlocked = true
	case "tab_switch":
		// Check metadata for count
		if count, ok := req.Metadata["count"].(float64); ok && count >= 3 {
			autoBlocked = true
		}
	}

	// Here you would typically insert into database
	// For now, we'll just return the response
	// TODO: Implement database insert

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"log_id":       "generated-uuid", // TODO: Get from database
		"auto_blocked": autoBlocked,
		"snapshot_path": snapshotPath,
	})
}

// GetSnapshot retrieves a proctoring snapshot
// GET /api/v1/files/proctoring/:org_id/:exam_id/:user_id/:filename
func (h *ProctoringHandler) GetSnapshot(c *gin.Context) {
	orgID := c.Param("org_id")
	examID := c.Param("exam_id")
	requestedUserID := c.Param("user_id")
	filename := c.Param("filename")

	// Get current user info from context
	currentUserID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	// Authorization check
	// Admin/Teacher can view all snapshots
	// Regular user can only view their own
	if role != "admin" && role != "teacher" && currentUserID != requestedUserID {
		c.JSON(http.StatusForbidden, model.StandardResponse{
			Success: false,
			Error:   "Access denied",
		})
		return
	}

	// Construct relative path
	relativePath := orgID + "/" + examID + "/" + requestedUserID + "/" + filename

	// Get file from storage
	fileData, err := h.storageService.GetFile(relativePath)
	if err != nil {
		c.JSON(http.StatusNotFound, model.StandardResponse{
			Success: false,
			Error:   "File not found",
		})
		return
	}

	// Determine content type based on extension
	contentType := "image/jpeg"
	if utils.ValidateFileExtension(filename, []string{"png"}) {
		contentType = "image/png"
	} else if utils.ValidateFileExtension(filename, []string{"webp"}) {
		contentType = "image/webp"
	}

	// Serve file
	c.Data(http.StatusOK, contentType, fileData)
}
