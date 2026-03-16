package cmd

import (
	"encoding/json"
	"net/http"
	"time"
)

// CheckServicesHealth writes JSON health status directly to ResponseWriter
func CheckServicesHealth(w http.ResponseWriter, r *http.Request) {
	services := map[string]string{
		"order":   "http://host.docker.internal:3001/health",
		"payment": "http://host.docker.internal:3002/health",
	}

	statuses := make(map[string]string)
	overall := "OK"

	for name, url := range services {
		client := http.Client{
			Timeout: 2 * time.Second,
		}
		resp, err := client.Get(url)
		if err != nil || resp.StatusCode != http.StatusOK {
			statuses[name] = "DOWN"
			overall = "FAILED"
		} else {
			statuses[name] = "UP"
		}
	}

	// Prepare JSON response
	response := map[string]interface{}{
		"services": statuses,
		"overall":  overall,
	}

	// Set headers and status code
	w.Header().Set("Content-Type", "application/json")
	if overall == "FAILED" {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	// Encode JSON and write to response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
