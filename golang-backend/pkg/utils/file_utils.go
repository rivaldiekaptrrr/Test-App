package utils

import (
	"errors"
	"path/filepath"
	"strings"
)

// SanitizePath removes dangerous characters and path traversal attempts
func SanitizePath(input string) string {
	// Clean the path
	cleaned := filepath.Clean(input)
	
	// Remove leading slashes and dots
	cleaned = strings.TrimLeft(cleaned, "./\\")
	
	// Replace path traversal attempts
	cleaned = strings.ReplaceAll(cleaned, "..", "")
	cleaned = strings.ReplaceAll(cleaned, "~", "")
	
	return cleaned
}

// ValidateStoragePath checks if a storage path is safe
func ValidateStoragePath(path string) error {
	// List of dangerous paths (Windows and Unix)
	dangerousPaths := []string{
		"/etc",
		"/root",
		"/sys",
		"/proc",
		"C:\\Windows",
		"C:\\Program Files",
		"C:\\System32",
		"/bin",
		"/sbin",
	}
	
	// Normalize the path
	normalized := filepath. Clean(path)
	
	// Check against dangerous paths
	for _, danger := range dangerousPaths {
		if strings.HasPrefix(strings.ToLower(normalized), strings.ToLower(danger)) {
			return errors.New("dangerous path not allowed: " + path)
		}
	}
	
	return nil
}

// ValidateFileExtension checks if a file extension is allowed
func ValidateFileExtension(filename string, allowedExtensions []string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	ext = strings.TrimPrefix(ext, ".")
	
	for _, allowed := range allowedExtensions {
		if ext == strings.ToLower(allowed) {
			return true
		}
	}
	
	return false
}

// GetFileSizeKB returns file size in kilobytes
func GetFileSizeKB(sizeBytes int64) int64 {
	return sizeBytes / 1024
}
