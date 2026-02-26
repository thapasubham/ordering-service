package cmd

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func Proxy(target string, prefix string) http.Handler {
	targetURL, _ := url.Parse(target)
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip prefix
		r.URL.Path = strings.TrimPrefix(r.URL.Path, prefix)
		proxy.ServeHTTP(w, r)
	})
}
