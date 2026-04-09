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

	"github.com/joho/godotenv"
	"github.com/thapasubham/ordering-service/gateway/cmd"
	"github.com/thapasubham/ordering-service/gateway/config"
)

func main() {
	godotenv.Load()

	signalChan := make(chan os.Signal, 1)

	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	mux := http.NewServeMux()
	mux.HandleFunc("/", cmd.Greet)
	mux.HandleFunc("/mango", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Tuff mango alert")
	})
	mux.HandleFunc("/health", cmd.CheckServicesHealth)
	mux.Handle("/order/", cmd.AuthMiddleware(cmd.Proxy(config.OrderURL, "/order")))
	mux.Handle("/payment/", cmd.AuthMiddleware(cmd.Proxy(config.PaymentURL, "/payment")))
	mux.Handle("/auth/", cmd.Proxy(config.UserAuthURL, "/auth"))

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
