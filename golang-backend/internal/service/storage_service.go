package service

import (
	"errors"
	"exam-system-backend/internal/config"
	"exam-system-backend/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// StorageService handles file storage operations
type StorageService struct {
	BaseStoragePath string
}

// NewStorageService creates a new storage service instance
func NewStorageService() *StorageService {
	return &StorageService{
		BaseStoragePath: config.AppConfig.StorageBasePath,
	}
}

// VerifyWriteAccess checks if the path is writable
func (s *StorageService) VerifyWriteAccess(path string) error {
	// Validate path safety
	if err := utils.ValidateStoragePath(path); err != nil {
		return err
	}

	// Create directory if not exists
	if err := os.MkdirAll(path, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Try to write test file
	testFile := filepath.Join(path, ".write_test")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		return errors.New("no write permission")
	}

	// Clean up test file
	os.Remove(testFile)
	return nil
}

// SaveSnapshot saves a proctoring snapshot to local storage
func (s *StorageService) SaveSnapshot(orgID, examID, userID string, data []byte) (string, error) {
	// Sanitize inputs
	orgID = utils.SanitizePath(orgID)
	examID = utils.SanitizePath(examID)
	userID = utils.SanitizePath(userID)

	// Create directory structure: /org_id/exam_id/user_id/
	dir := filepath.Join(s.BaseStoragePath, orgID, examID, userID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Generate filename with timestamp
	filename := time.Now().Format("2006-01-02_15-04-05") + ".jpg"
	filePath := filepath.Join(dir, filename)

	// Write file
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return relative path
	relativePath := filepath.Join(orgID, examID, userID, filename)
	return relativePath, nil
}

// SaveAnswerFile saves an answer file upload
func (s *StorageService) SaveAnswerFile(orgID, examID, userID, questionID string, filename string, data []byte) (string, error) {
	// Sanitize inputs
	orgID = utils.SanitizePath(orgID)
	examID = utils.SanitizePath(examID)
	userID = utils.SanitizePath(userID)
	questionID = utils.SanitizePath(questionID)

	// Create directory structure: /org_id/exam_id/user_id/answers/
	dir := filepath.Join(s.BaseStoragePath, orgID, examID, userID, "answers")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Sanitize filename
	safeFilename := questionID + "_" + utils.SanitizePath(filename)
	filePath := filepath.Join(dir, safeFilename)

	// Write file
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return relative path
	relativePath := filepath.Join(orgID, examID, userID, "answers", safeFilename)
	return relativePath, nil
}

// GetFile retrieves a file from storage
func (s *StorageService) GetFile(relativePath string) ([]byte, error) {
	// Sanitize path
	safePath := utils.SanitizePath(relativePath)
	fullPath := filepath.Join(s.BaseStoragePath, safePath)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return nil, errors.New("file not found")
	}

	// Read file
	data, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return data, nil
}

// DeleteFile removes a file from storage
func (s *StorageService) DeleteFile(relativePath string) error {
	safePath := utils.SanitizePath(relativePath)
	fullPath := filepath.Join(s.BaseStoragePath, safePath)
	
	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	
	return nil
}

// GetDiskSpace returns disk space information (simplified)
func (s *StorageService) GetDiskSpace() (int64, int64, error) {
	// This is a simplified version
	// For production, use syscall or a library like github.com/ricochet2200/go-disk-usage
	
	// For now, return dummy values
	// TODO: Implement actual disk space calculation
	totalGB := int64(100)
	freeGB := int64(55)
	
	return totalGB, freeGB, nil
}
