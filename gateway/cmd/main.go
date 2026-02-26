package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	mux.Handle("/order/", proxy("http://localhost:3001", "/orders"))
	mux.Handle("/payment/", proxy("http://localhost:3002", "/payment"))

	log.Fatal(http.ListenAndServe(":3067", loggingMiddleware(mux)))
}

func proxy(target string, prefix string) http.Handler {
	targetURL, _ := url.Parse(target)
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip prefix
		r.URL.Path = strings.TrimPrefix(r.URL.Path, prefix)
		proxy.ServeHTTP(w, r)
	})
}
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] %s", r.Method, r.URL)
		next.ServeHTTP(w, r)
	})
}
