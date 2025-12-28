package services

import (
	"sync"

	"github.com/jajanin/backend/internal/utils"
)

type AlertData struct {
	SupporterName string `json:"supporter_name"`
	Amount        int64  `json:"amount"`
	Message       string `json:"message"`
	CreatorName   string `json:"creator_name"`
	ProductName   string `json:"product_name,omitempty"`
	ProductEmoji  string `json:"product_emoji,omitempty"`
	Quantity      int    `json:"quantity"`
}

type AlertService struct {
	clients map[string][]chan *AlertData
	mu      sync.RWMutex
}

func NewAlertService() *AlertService {
	return &AlertService{
		clients: make(map[string][]chan *AlertData),
	}
}

func (s *AlertService) Register(username string, ch chan *AlertData) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clients[username] = append(s.clients[username], ch)
}

func (s *AlertService) Unregister(username string, ch chan *AlertData) {
	s.mu.Lock()
	defer s.mu.Unlock()

	channels := s.clients[username]
	for i, c := range channels {
		if c == ch {
			s.clients[username] = append(channels[:i], channels[i+1:]...)
			close(ch)
			return
		}
	}
}

func (s *AlertService) Broadcast(log *utils.RequestLogger, username string, alert *AlertData) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	channels := s.clients[username]
	if len(channels) == 0 {
		return
	}

	for _, ch := range channels {
		select {
		case ch <- alert:
		default:
		}
	}

	log.Info().Str("user", username).Int("clients", len(channels)).Msg("Alert broadcast")
}

func (s *AlertService) GetClientCount(username string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients[username])
}
