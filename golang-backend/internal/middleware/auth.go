package middleware

import (
	"exam-system-backend/internal/config"
	"exam-system-backend/internal/model"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates JWT token from Supabase
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, model.StandardResponse{
				Success: false,
				Error:   "Missing authorization header",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, model.StandardResponse{
				Success: false,
				Error:   "Invalid authorization format. Use 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		// Parse and validate JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(config.AppConfig.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, model.StandardResponse{
				Success: false,
				Error:   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Store user info in context
			if sub, ok := claims["sub"].(string); ok {
				c.Set("user_id", sub)
			}
			if email, ok := claims["email"].(string); ok {
				c.Set("email", email)
			}
			if role, ok := claims["role"].(string); ok {
				c.Set("role", role)
			}
			// Organization ID might be in custom claims
			if orgID, ok := claims["org_id"].(string); ok {
				c.Set("org_id", orgID)
			}
		}

		c.Next()
	}
}

// AdminOnly middleware ensures only admins can access
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, model.StandardResponse{
				Success: false,
				Error:   "Admin access required",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
