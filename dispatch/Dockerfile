FROM golang:1.23

WORKDIR /go/src/app

# Copy go.mod and go.sum first to leverage Docker layer caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod tidy

# Copy source files
COPY . .

# Ensure required modules are installed
RUN go get -d ./...

# Build the application
RUN go build -o app

CMD ["./app"]
