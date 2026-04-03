package middleware

import (
	"ecommerce-api/models"
	"ecommerce-api/services"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// extractRole gets the role either from the Gin context (set by Auth middleware)
// or directly from the JWT cookie (for public routes where Auth hasn't run).
func extractRole(c *gin.Context) string {
	if role, exists := c.Get("role"); exists {
		if r, ok := role.(string); ok {
			return r
		}
	}

	cookie, err := c.Cookie("access_token")
	if err != nil {
		return ""
	}

	token, err := jwt.Parse(cookie, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return ""
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return ""
	}

	role, _ := claims["role"].(string)
	return role
}

// ApiControl returns a middleware that blocks non-admin users when an API endpoint is disabled.
// Admins always bypass the control. The cache TTL in ApiControlService limits DB calls.
func ApiControl(svc *services.ApiControlService, routeKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Admins always bypass API controls
		if extractRole(c) == "admin" {
			c.Next()
			return
		}

		if svc.IsEnabled(routeKey) {
			c.Next()
			return
		}

		msg := svc.GetDisabledMessage(routeKey)
		if msg == "" {
			msg = "API này tạm thời không khả dụng. Vui lòng thử lại sau."
		}
		c.JSON(http.StatusServiceUnavailable, models.NewErrorResponse(msg))
		c.Abort()
	}
}
