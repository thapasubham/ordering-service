package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/thapasubham/ordering-service/gateway/config"
)

// CheckServicesHealth writes JSON health status directly to ResponseWriter
func CheckServicesHealth(w http.ResponseWriter, r *http.Request) {
	services := map[string]string{
		"order":        fmt.Sprintf("%s/health", config.OrderURL),
		"payment":      fmt.Sprintf("%s/health", config.PaymentURL),
		"auth-service": fmt.Sprintf("%s/health", config.UserAuthURL),
	}

	statuses := make(map[string]interface{})
	overall := "OK"

	client := http.Client{
		Timeout: 2 * time.Second,
	}

	for name, url := range services {
		resp, err := client.Get(url)
		if err != nil {
			statuses[name] = "DOWN"
			overall = "FAILED"
			continue
		}

		body, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()

		if readErr != nil || resp.StatusCode != http.StatusOK {
			statuses[name] = "DOWN"
			overall = "FAILED"
			continue
		}
		var serviceResp map[string]interface{}
		err = json.Unmarshal(body, &serviceResp)
		if err != nil {
			statuses[name] = map[string]string{
				"status": "DOWN",
			}
			overall = "FAILED"
			continue
		}

		statuses[name] = serviceResp
	}

	response := map[string]interface{}{
		"services": statuses,
		"overall":  overall,
	}

	w.Header().Set("Content-Type", "application/json")

	if overall == "FAILED" {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	json.NewEncoder(w).Encode(response)
}
func Greet(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World! %s", time.Now())
}
