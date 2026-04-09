package config

import (
	"fmt"
	"os"
)

var (
	// URLs for other microservices
	OrderURL   = getEnv("ORDER_URL", "http://localhost:3001")
	PaymentURL = getEnv("PAYMENT_URL", "http://localhost:3002")
	UserAuthURL = getEnv("USER_AUTH_URL", "http://localhost:3003")
)

// getEnv returns the environment variable or a default
func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		fmt.Println("Using value from .env")
		return value
	}
	fmt.Println(("Using fallback url"))
	return defaultVal
}
