package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/thapasubham/ordering-service/gateway/cmd"
)

func main() {
	signalChan := make(chan os.Signal, 1)

	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", cmd.CheckServicesHealth)
	mux.Handle("/order/", cmd.Proxy("http://host.docker.internal:3001", "/order"))
	mux.Handle("/payment/", cmd.Proxy("http://host.docker.internal:3002", "/payment"))

	server := &http.Server{
		Addr:    ":8080",
		Handler: cmd.LoggingMiddleware(mux),
	}
	go func() {
		fmt.Print("Server running at localhost:8080")
		log.Fatal(server.ListenAndServe())
	}()
	sig := <-signalChan
	log.Printf("Received signal: %v. Shutting down...", sig)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed:%+v", err)
	}
	close(signalChan)
	log.Println("Server exited gracefully")
}
