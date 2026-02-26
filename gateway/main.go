package main

import (
	"log"
	"net/http"

	"github.com/thapasubham/ordering-service/gateway/cmd"
)

func main() {
	mux := http.NewServeMux()

	mux.Handle("/order/", cmd.Proxy("http://localhost:3001", "/orders"))
	mux.Handle("/payment/", cmd.Proxy("http://localhost:3002", "/payment"))

	log.Fatal(http.ListenAndServe(":3067", cmd.LoggingMiddleware(mux)))
}
