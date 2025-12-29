# Jajanin Backend Docker Image
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Set Go proxy with fallback
ENV GOPROXY=https://proxy.golang.org,direct

RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run
CMD ["./main"]
