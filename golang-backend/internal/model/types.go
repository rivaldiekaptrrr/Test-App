package model

import "time"

// SnapshotUploadRequest represents a proctoring snapshot upload
type SnapshotUploadRequest struct {
	SessionID string `form:"session_id" binding:"required"`
	Timestamp string `form:"timestamp" binding:"required"`
}

// ViolationLogRequest represents a cheating violation log
type ViolationLogRequest struct {
	SessionID     string                 `json:"session_id" binding:"required"`
	ViolationType string                 `json:"violation_type" binding:"required"`
	Metadata      map[string]interface{} `json:"metadata"`
	Snapshot      string                 `json:"snapshot"` // base64 encoded image (optional)
}

// StorageConfigRequest represents storage path configuration
type StorageConfigRequest struct {
	OrganizationID string `json:"organization_id" binding:"required"`
	StoragePath    string `json:"storage_path" binding:"required"`
}

// StorageConfigResponse represents the storage configuration response
type StorageConfigResponse struct {
	OrganizationID string    `json:"organization_id"`
	StoragePath    string    `json:"storage_path"`
	Writable       bool      `json:"writable"`
	DiskSpace      DiskSpace `json:"disk_space"`
}

// DiskSpace represents disk usage information
type DiskSpace struct {
	TotalGB int `json:"total_gb"`
	UsedGB  int `json:"used_gb"`
	FreeGB  int `json:"free_gb"`
}

// AnswerFileUploadRequest represents an answer file upload
type AnswerFileUploadRequest struct {
	SessionID  string `form:"session_id" binding:"required"`
	QuestionID string `form:"question_id" binding:"required"`
}

// StandardResponse represents a standard API response
type StandardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// FileUploadResponse represents file upload response
type FileUploadResponse struct {
	Success  bool   `json:"success"`
	FilePath string `json:"file_path"`
	SizeKB   int64  `json:"size_kb"`
	MimeType string `json:"mime_type,omitempty"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status             string `json:"status"`
	UptimeSeconds      int64  `json:"uptime_seconds"`
	StorageAccessible  bool   `json:"storage_accessible"`
	DatabaseConnected  bool   `json:"database_connected"`
}

// JWTClaims represents JWT token claims
type JWTClaims struct {
	Sub   string `json:"sub"`   // User ID
	Email string `json:"email"` // User email
	Role  string `json:"role"`  // User role
	OrgID string `json:"org_id"` // Organization ID
}

// CheatingLog represents a cheating log entry for database
type CheatingLog struct {
	ID            string                 `json:"id"`
	SessionID     string                 `json:"session_id"`
	ViolationType string                 `json:"violation_type"`
	SnapshotPath  string                 `json:"snapshot_path"`
	Metadata      map[string]interface{} `json:"metadata"`
	AutoBlocked   bool                   `json:"auto_blocked"`
	CreatedAt     time.Time              `json:"created_at"`
}
