package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jajanin/backend/internal/utils"
)

// RateLimiter implements a token bucket rate limiter
type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     int           // requests per interval
	interval time.Duration // time interval
}

type visitor struct {
	tokens    int
	lastReset time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		interval: interval,
	}

	// Cleanup old visitors every minute
	go rl.cleanupVisitors()

	return rl
}

func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastReset) > rl.interval*2 {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) getVisitor(ip string) *visitor {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		v = &visitor{
			tokens:    rl.rate,
			lastReset: time.Now(),
		}
		rl.visitors[ip] = v
		return v
	}

	// Reset tokens if interval has passed
	if time.Since(v.lastReset) > rl.interval {
		v.tokens = rl.rate
		v.lastReset = time.Now()
	}

	return v
}

func (rl *RateLimiter) allow(ip string) bool {
	v := rl.getVisitor(ip)

	rl.mu.Lock()
	defer rl.mu.Unlock()

	if v.tokens > 0 {
		v.tokens--
		return true
	}
	return false
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(rate int, interval time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(rate, interval)

	return func(c *gin.Context) {
		ip := c.ClientIP()

		if !limiter.allow(ip) {
			utils.Log.Warn().
				Str("client_ip", ip).
				Str("path", c.Request.URL.Path).
				Msg("Rate limit exceeded")

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}

// StrictRateLimitMiddleware for auth endpoints (stricter limits)
func StrictRateLimitMiddleware() gin.HandlerFunc {
	return RateLimitMiddleware(10, time.Minute) // 10 requests per minute
}

// GeneralRateLimitMiddleware for general API endpoints
func GeneralRateLimitMiddleware() gin.HandlerFunc {
	return RateLimitMiddleware(100, time.Minute) // 100 requests per minute
}
