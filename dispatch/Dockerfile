# Use a modern Go version
FROM golang:1.21

# Set working directory inside the container
WORKDIR /app

# Copy go files and dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# Copy all Go files
COPY *.go . 

# Build the binary
RUN go build -o dispatch

# Run the binary
CMD ["./dispatch"]
