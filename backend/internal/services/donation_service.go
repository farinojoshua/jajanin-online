package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/repository"
	"github.com/jajanin/backend/internal/utils"
)

type DonationService struct {
	donationRepo *repository.DonationRepository
	userRepo     *repository.UserRepository
	paylabs      *PaylabsService
	alertService *AlertService
}

func NewDonationService(
	donationRepo *repository.DonationRepository,
	userRepo *repository.UserRepository,
	paylabs *PaylabsService,
	alertService *AlertService,
) *DonationService {
	return &DonationService{
		donationRepo: donationRepo,
		userRepo:     userRepo,
		paylabs:      paylabs,
		alertService: alertService,
	}
}

type CreateDonationInput struct {
	CreatorUsername string     `json:"creator_username" binding:"required"`
	ProductID       *uuid.UUID `json:"product_id"`
	BuyerName       string     `json:"buyer_name" binding:"required"`
	BuyerEmail      string     `json:"buyer_email" binding:"required,email"`
	Amount          int64      `json:"amount" binding:"required,min=1000"`
	Quantity        int        `json:"quantity"`
	Message         string     `json:"message"`
	PaymentMethod   string     `json:"payment_method"` // qris, gopay, dana, shopee, ovo, linkaja
	RedirectUrl     string     `json:"redirect_url"`   // For e-wallet redirect after payment
}

type CreateDonationResponse struct {
	Donation        *models.Donation `json:"donation"`
	PaymentURL      string           `json:"payment_url"`
	Token           string           `json:"token"`
	QRCode          string           `json:"qr_code,omitempty"`
	QRISUrl         string           `json:"qris_url,omitempty"`
	ExpiredTime     string           `json:"expired_time,omitempty"`
	PlatformTradeNo string           `json:"platform_trade_no,omitempty"`
	PaymentType     string           `json:"payment_type,omitempty"` // qris or ewallet type
}

// Payment method to Paylabs paymentType mapping
var ewalletPaymentTypes = map[string]string{
	"gopay":   "GOPAYBALANCE",
	"dana":    "DANABALANCE",
	"shopee":  "SHOPEEBALANCE",
	"ovo":     "OVOBALANCE",
	"linkaja": "LINKAJABALANCE",
}

func (s *DonationService) CreateDonation(log *utils.RequestLogger, input *CreateDonationInput, buyerID *uuid.UUID) (*CreateDonationResponse, error) {
	// Find creator
	creator, err := s.userRepo.FindByUsername(input.CreatorUsername)
	if err != nil {
		return nil, errors.New("creator not found")
	}

	// Set default quantity
	quantity := input.Quantity
	if quantity < 1 {
		quantity = 1
	}

	// Default payment method is QRIS
	if input.PaymentMethod == "" {
		input.PaymentMethod = "qris"
	}

	// Fetch product info for denormalization
	var productName, productEmoji string
	if input.ProductID != nil {
		product, err := s.donationRepo.FindProductByID(*input.ProductID)
		if err == nil && product != nil {
			productName = product.Name
			productEmoji = product.Emoji
		}
	}

	// Create donation
	donation := &models.Donation{
		CreatorID:     creator.ID,
		ProductID:     input.ProductID,
		BuyerID:       buyerID,
		BuyerName:     input.BuyerName,
		BuyerEmail:    input.BuyerEmail,
		Amount:        input.Amount,
		Quantity:      quantity,
		Message:       input.Message,
		PaymentStatus: models.PaymentStatusPending,
		PaymentMethod: input.PaymentMethod,
		ProductName:   productName,  // Denormalized
		ProductEmoji:  productEmoji, // Denormalized
	}

	if err := s.donationRepo.Create(donation); err != nil {
		log.LogError("DonationService", err, "Failed to create donation")
		return nil, errors.New("failed to create donation")
	}

	// Route to QRIS or E-Wallet based on payment method
	if input.PaymentMethod == "qris" {
		// Create Paylabs QRIS transaction
		paymentResp, err := s.paylabs.CreateTransaction(log, donation, creator)
		if err != nil {
			log.LogError("DonationService", err, "Failed to create QRIS payment")
			return nil, errors.New("failed to create payment: " + err.Error())
		}

		// Update donation with payment ID
		donation.PaymentID = paymentResp.OrderID
		if err := s.donationRepo.Update(donation); err != nil {
			log.LogError("DonationService", err, "Failed to update donation")
			return nil, errors.New("failed to update donation")
		}

		return &CreateDonationResponse{
			Donation:        donation,
			PaymentURL:      paymentResp.QRISUrl,
			Token:           paymentResp.OrderID,
			QRCode:          paymentResp.QRCode,
			QRISUrl:         paymentResp.QRISUrl,
			ExpiredTime:     paymentResp.ExpiredTime,
			PlatformTradeNo: paymentResp.PlatformTradeNo,
			PaymentType:     "qris",
		}, nil
	}

	// E-Wallet payment
	paylabsPaymentType, ok := ewalletPaymentTypes[input.PaymentMethod]
	if !ok {
		return nil, errors.New("invalid payment method: " + input.PaymentMethod)
	}

	// E-Wallet requires minimum Rp 10,000
	if input.Amount < 10000 {
		return nil, errors.New("minimum amount untuk E-Wallet adalah Rp 10.000")
	}

	// Create E-Wallet transaction
	ewalletResp, err := s.paylabs.CreateEWalletTransaction(log, donation, creator, paylabsPaymentType, input.RedirectUrl)
	if err != nil {
		log.LogError("DonationService", err, "Failed to create E-Wallet payment")
		return nil, errors.New("failed to create payment: " + err.Error())
	}

	// Update donation with payment ID
	donation.PaymentID = ewalletResp.OrderID
	if err := s.donationRepo.Update(donation); err != nil {
		log.LogError("DonationService", err, "Failed to update donation")
		return nil, errors.New("failed to update donation")
	}

	return &CreateDonationResponse{
		Donation:        donation,
		PaymentURL:      ewalletResp.PaymentUrl,
		Token:           ewalletResp.OrderID,
		ExpiredTime:     ewalletResp.ExpiredTime,
		PlatformTradeNo: ewalletResp.PlatformTradeNo,
		PaymentType:     input.PaymentMethod,
	}, nil
}

func (s *DonationService) GetCreatorDonations(creatorID uuid.UUID, page, limit int) ([]models.Donation, error) {
	offset := (page - 1) * limit
	return s.donationRepo.FindByCreatorID(creatorID, limit, offset)
}

func (s *DonationService) GetCreatorDonationsWithCount(creatorID uuid.UUID, page, limit int) ([]models.Donation, int64, error) {
	offset := (page - 1) * limit
	donations, err := s.donationRepo.FindByCreatorID(creatorID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	total, err := s.donationRepo.CountByCreatorID(creatorID)
	if err != nil {
		return nil, 0, err
	}
	return donations, total, nil
}

func (s *DonationService) GetRecentDonations(creatorUsername string, limit int) ([]models.Donation, error) {
	creator, err := s.userRepo.FindByUsername(creatorUsername)
	if err != nil {
		return nil, errors.New("creator not found")
	}
	return s.donationRepo.FindRecentByCreatorID(creator.ID, limit)
}

func (s *DonationService) GetStats(creatorID uuid.UUID) (*repository.DonationStats, error) {
	return s.donationRepo.GetStats(creatorID)
}

func (s *DonationService) GetMonthlyStats(creatorID uuid.UUID) (*repository.DonationStats, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	return s.donationRepo.GetStatsByPeriod(creatorID, startOfMonth, now)
}

func (s *DonationService) GetDailyStats(creatorID uuid.UUID, days int) ([]repository.DailyStats, error) {
	return s.donationRepo.GetDailyStats(creatorID, days)
}

// GetDonationByPaymentID returns donation by payment ID (order ID)
func (s *DonationService) GetDonationByPaymentID(paymentID string) (*models.Donation, error) {
	return s.donationRepo.FindByPaymentID(paymentID)
}

func (s *DonationService) UpdatePaymentStatus(log *utils.RequestLogger, paymentID string, status models.PaymentStatus) error {
	donation, err := s.donationRepo.FindByPaymentID(paymentID)
	if err != nil {
		return errors.New("donation not found")
	}

	// Skip if already in the target status (prevent race condition / double processing)
	if donation.PaymentStatus == status {
		log.Info().Str("payment_id", paymentID).Msg("Payment status already updated, skipping")
		return nil
	}

	// Don't allow reverting from paid status
	if donation.PaymentStatus == models.PaymentStatusPaid {
		log.Info().Str("payment_id", paymentID).Msg("Payment already paid, skipping status update")
		return nil
	}

	if err := s.donationRepo.UpdatePaymentStatus(donation.ID, status); err != nil {
		log.LogError("DonationService", err, "Failed to update payment status")
		return err
	}

	// Broadcast alert if payment is successful
	if status == models.PaymentStatusPaid && s.alertService != nil {
		creator, err := s.userRepo.FindByID(donation.CreatorID)
		if err == nil {
			alert := &AlertData{
				SupporterName: donation.BuyerName,
				Amount:        donation.Amount,
				Message:       donation.Message,
				CreatorName:   creator.Name,
				Quantity:      donation.Quantity,
				ProductName:   donation.ProductName,  // Use denormalized
				ProductEmoji:  donation.ProductEmoji, // Use denormalized
			}

			// Broadcast using user ID (overlay now registers by user ID)
			s.alertService.Broadcast(log, creator.ID.String(), alert)
		}
	}

	return nil
}
