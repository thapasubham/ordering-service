package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/thapasubham/ordering-service/gateway/config"
)

type VerifyResponse struct {
	Valid bool `json:"valid"`
	User  any  `json:"user"`
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: No token provided", http.StatusUnauthorized)
			return
		}

		client := &http.Client{}
		req, err := http.NewRequest("GET", config.UserAuthURL+"/api/verify", nil)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Authorization", authHeader)

		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "Auth Service Unavailable", http.StatusServiceUnavailable)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		var verifyResp VerifyResponse
		if err := json.NewDecoder(resp.Body).Decode(&verifyResp); err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if !verifyResp.Valid {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		fmt.Printf("User verified: %v\n", verifyResp.User)
		next.ServeHTTP(w, r)
	})
}
