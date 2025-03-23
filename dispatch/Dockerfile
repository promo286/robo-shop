FROM golang:1.21

WORKDIR /go/src/app

COPY go.mod go.sum ./
RUN go mod tidy

COPY *.go ./
RUN go build -o app

CMD ["./app"]
