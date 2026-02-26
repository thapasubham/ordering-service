package main

import (
	"context"
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

	mux.Handle("/order/", cmd.Proxy("http://localhost:3001", "/order"))
	mux.Handle("/payment/", cmd.Proxy("http://localhost:3002", "/payment"))
	server := &http.Server{
		Addr:    ":8004",
		Handler: cmd.LoggingMiddleware(mux),
	}
	go func() {
		log.Fatal(server.ListenAndServe())
	}()
	<-signalChan
	log.Printf("Received signal: %v. Shutting down...", signalChan)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed:%+v", err)
	}

	log.Println("Server exited gracefully")
}
