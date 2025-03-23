FROM golang:1.17

WORKDIR /go/src/app

# Copy Go modules and install dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the application source code
COPY *.go ./

# Build the application
RUN go build -o app

# Run the application
CMD ["./app"]
