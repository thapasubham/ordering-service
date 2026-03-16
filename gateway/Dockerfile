# Build stage
FROM golang:1.25.6-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum for dependency caching
COPY go.mod ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go binary
RUN go build -o myservice

# Final stage
FROM alpine:latest

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/myservice .

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./myservice"]