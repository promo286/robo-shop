# Stage 1: Build Stage
FROM golang:1.21 AS builder

WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker caching
COPY go.mod go.sum ./

# Ensure modules are downloaded before copying full source code
RUN go mod tidy

# Copy source code
COPY . .

# Build the application as a static binary
RUN go build -o dispatch

# Stage 2: Create a lightweight final image
FROM alpine:latest

WORKDIR /root/

# Copy the compiled binary from the builder stage
COPY --from=builder /app/dispatch .

# Set executable permissions (optional but ensures no issues)
RUN chmod +x dispatch

# Run the application
CMD ["./dispatch"]
