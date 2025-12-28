package services

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/config"
	"github.com/jajanin/backend/internal/models"
	"github.com/jajanin/backend/internal/utils"
)

type PaylabsService struct {
	cfg        *config.Config
	privateKey *rsa.PrivateKey
	httpClient *http.Client
}

func NewPaylabsService(cfg *config.Config) (*PaylabsService, error) {
	privateKey, err := parsePrivateKey(cfg.PaylabsPrivateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	utils.Log.Info().Int("key_bits", privateKey.N.BitLen()).Msg("Paylabs private key loaded")

	return &PaylabsService{
		cfg:        cfg,
		privateKey: privateKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func parsePrivateKey(keyStr string) (*rsa.PrivateKey, error) {
	if !strings.Contains(keyStr, "-----BEGIN") {
		keyStr = "-----BEGIN RSA PRIVATE KEY-----\n" + keyStr + "\n-----END RSA PRIVATE KEY-----"
	}

	block, _ := pem.Decode([]byte(keyStr))
	if block == nil {
		return nil, errors.New("failed to decode PEM block")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		var ok bool
		privateKey, ok = key.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("key is not RSA private key")
		}
	}

	return privateKey, nil
}

type QRISRequest struct {
	RequestID       string        `json:"requestId"`
	MerchantID      string        `json:"merchantId"`
	StoreID         string        `json:"storeId,omitempty"`
	PaymentType     string        `json:"paymentType"`
	Amount          string        `json:"amount"`
	MerchantTradeNo string        `json:"merchantTradeNo"`
	NotifyURL       string        `json:"notifyUrl,omitempty"`
	Expire          int           `json:"expire,omitempty"`
	FeeType         string        `json:"feeType,omitempty"`
	ProductName     string        `json:"productName"`
	ProductInfo     []ProductInfo `json:"productInfo,omitempty"`
}

type ProductInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Price    string `json:"price"`
	Type     string `json:"type"`
	URL      string `json:"url,omitempty"`
	Quantity int    `json:"quantity"`
}

// EWalletPaymentActions contains payment URLs from e-wallet response
type EWalletPaymentActions struct {
	PCPayUrl     string `json:"pcPayUrl,omitempty"`
	MobilePayUrl string `json:"mobilePayUrl,omitempty"`
	AppDeeplink  string `json:"appDeeplink,omitempty"`
}

type QRISResponse struct {
	RequestID       string                 `json:"requestId"`
	ErrCode         string                 `json:"errCode"`
	ErrCodeDes      string                 `json:"errCodeDes,omitempty"`
	MerchantID      string                 `json:"merchantId"`
	StoreID         string                 `json:"storeId,omitempty"`
	PaymentType     string                 `json:"paymentType"`
	RequestAmount   string                 `json:"requestAmount,omitempty"`
	Amount          string                 `json:"amount"`
	MerchantTradeNo string                 `json:"merchantTradeNo"`
	CreateTime      string                 `json:"createTime,omitempty"`
	QRCode          string                 `json:"qrCode,omitempty"`
	QRISUrl         string                 `json:"qrisUrl,omitempty"`
	NMID            string                 `json:"nmid,omitempty"`
	PlatformTradeNo string                 `json:"platformTradeNo,omitempty"`
	SuccessTime     string                 `json:"successTime,omitempty"`
	ExpiredTime     string                 `json:"expiredTime,omitempty"`
	Status          json.RawMessage        `json:"status,omitempty"`
	ProductName     string                 `json:"productName"`
	TransFeeRate    string                 `json:"transFeeRate,omitempty"`
	TransFeeAmount  string                 `json:"transFeeAmount,omitempty"`
	TotalTransFee   string                 `json:"totalTransFee,omitempty"`
	VatFee          string                 `json:"vatFee,omitempty"`
	PaymentActions  *EWalletPaymentActions `json:"paymentActions,omitempty"` // For E-Wallet
}

func (r *QRISResponse) GetStatus() string {
	if len(r.Status) == 0 {
		return ""
	}
	var strStatus string
	if err := json.Unmarshal(r.Status, &strStatus); err == nil {
		return strStatus
	}
	var numStatus int
	if err := json.Unmarshal(r.Status, &numStatus); err == nil {
		return fmt.Sprintf("%02d", numStatus)
	}
	return string(r.Status)
}

type PaymentResponse struct {
	OrderID         string `json:"order_id"`
	Token           string `json:"token"`
	RedirectURL     string `json:"redirect_url"`
	QRCode          string `json:"qr_code"`
	QRISUrl         string `json:"qris_url"`
	ExpiredTime     string `json:"expired_time"`
	PlatformTradeNo string `json:"platform_trade_no"`
}

func (s *PaylabsService) CreateTransaction(log *utils.RequestLogger, donation *models.Donation, creator *models.User) (*PaymentResponse, error) {
	orderID := fmt.Sprintf("JJN-%s", donation.ID.String()[:8])
	requestID := generateRequestID()

	req := QRISRequest{
		RequestID:       requestID,
		MerchantID:      s.cfg.PaylabsMerchantID,
		PaymentType:     "QRIS",
		Amount:          fmt.Sprintf("%.2f", float64(donation.Amount)),
		MerchantTradeNo: orderID,
		Expire:          900,
		FeeType:         "OUR",
		ProductName:     fmt.Sprintf("Donasi untuk %s", creator.Name),
	}

	// Only set NotifyURL if AppURL is not localhost (Paylabs requires non-loopback address)
	if !strings.Contains(s.cfg.AppURL, "localhost") && !strings.Contains(s.cfg.AppURL, "127.0.0.1") {
		req.NotifyURL = fmt.Sprintf("%s/api/v1/payment/webhook", s.cfg.AppURL)
	}

	resp, err := s.callPaylabsAPI(log, "/payment/v2.3/qris/create", req)
	if err != nil {
		return nil, err
	}

	if resp.ErrCode != "0" {
		return nil, fmt.Errorf("paylabs error: %s - %s", resp.ErrCode, resp.ErrCodeDes)
	}

	return &PaymentResponse{
		OrderID:         orderID,
		QRCode:          resp.QRCode,
		QRISUrl:         resp.QRISUrl,
		ExpiredTime:     resp.ExpiredTime,
		PlatformTradeNo: resp.PlatformTradeNo,
	}, nil
}

// ========== E-WALLET ==========

// EWalletRequest for e-wallet payment creation
type EWalletRequest struct {
	RequestID       string                `json:"requestId"`
	MerchantID      string                `json:"merchantId"`
	PaymentType     string                `json:"paymentType"`
	Amount          string                `json:"amount"`
	MerchantTradeNo string                `json:"merchantTradeNo"`
	NotifyURL       string                `json:"notifyUrl,omitempty"`
	FeeType         string                `json:"feeType,omitempty"`
	ProductName     string                `json:"productName"`
	PaymentParams   *EWalletPaymentParams `json:"paymentParams,omitempty"`
}

// EWalletPaymentParams contains redirect URL for e-wallet
type EWalletPaymentParams struct {
	RedirectUrl string `json:"redirectUrl"`
	PhoneNumber string `json:"phoneNumber,omitempty"` // For OVO
}

// EWalletResponse extends PaymentResponse with e-wallet specific fields
type EWalletPaymentResponse struct {
	OrderID         string                 `json:"order_id"`
	ExpiredTime     string                 `json:"expired_time"`
	PlatformTradeNo string                 `json:"platform_trade_no"`
	PaymentUrl      string                 `json:"payment_url"` // Primary URL for redirect
	PaymentActions  *EWalletPaymentActions `json:"payment_actions,omitempty"`
}

// CreateEWalletTransaction creates an e-wallet payment (DANA, GoPay, Shopee, OVO, Linkaja)
func (s *PaylabsService) CreateEWalletTransaction(log *utils.RequestLogger, donation *models.Donation, creator *models.User, paymentType, redirectUrl string) (*EWalletPaymentResponse, error) {
	orderID := fmt.Sprintf("JJN-%s", donation.ID.String()[:8])
	requestID := generateRequestID()

	req := EWalletRequest{
		RequestID:       requestID,
		MerchantID:      s.cfg.PaylabsMerchantID,
		PaymentType:     paymentType,                                   // DANABALANCE, GOPAYBALANCE, etc.
		Amount:          fmt.Sprintf("%.2f", float64(donation.Amount)), // Decimal(12,2) format per Paylabs docs
		MerchantTradeNo: orderID,
		FeeType:         "OUR",
		ProductName:     fmt.Sprintf("Donasi untuk %s", creator.Name),
		PaymentParams: &EWalletPaymentParams{
			RedirectUrl: redirectUrl,
		},
	}

	// Only set NotifyURL if AppURL is not localhost
	if !strings.Contains(s.cfg.AppURL, "localhost") && !strings.Contains(s.cfg.AppURL, "127.0.0.1") {
		req.NotifyURL = fmt.Sprintf("%s/api/v1/payment/webhook", s.cfg.AppURL)
	}

	resp, err := s.callPaylabsAPI(log, "/payment/v2.3/ewallet/create", req)
	if err != nil {
		return nil, err
	}

	if resp.ErrCode != "0" {
		return nil, fmt.Errorf("paylabs error: %s - %s", resp.ErrCode, resp.ErrCodeDes)
	}

	// Determine the best payment URL
	paymentUrl := ""
	if resp.PaymentActions != nil {
		if resp.PaymentActions.MobilePayUrl != "" {
			paymentUrl = resp.PaymentActions.MobilePayUrl
		} else if resp.PaymentActions.PCPayUrl != "" {
			paymentUrl = resp.PaymentActions.PCPayUrl
		}
	}

	return &EWalletPaymentResponse{
		OrderID:         orderID,
		ExpiredTime:     resp.ExpiredTime,
		PlatformTradeNo: resp.PlatformTradeNo,
		PaymentUrl:      paymentUrl,
		PaymentActions:  resp.PaymentActions,
	}, nil
}

// QRISQueryRequest for status inquiry
type QRISQueryRequest struct {
	RequestID       string `json:"requestId"`
	MerchantID      string `json:"merchantId"`
	MerchantTradeNo string `json:"merchantTradeNo"`
	PaymentType     string `json:"paymentType"`
}

// QueryStatusResponse holds the parsed query result
type QueryStatusResponse struct {
	Status      string `json:"status"` // 01=pending, 02=success, 09=failed
	ErrCode     string `json:"err_code"`
	ErrCodeDes  string `json:"err_code_des"`
	Payer       string `json:"payer,omitempty"`
	SuccessTime string `json:"success_time,omitempty"`
}

// QueryTransaction checks payment status using the correct endpoint based on payment method
func (s *PaylabsService) QueryTransaction(log *utils.RequestLogger, merchantTradeNo string, paymentMethod string) (*QueryStatusResponse, error) {
	// Determine endpoint and payment type based on payment method
	var endpoint string
	var paylabsPaymentType string

	if paymentMethod == "qris" || paymentMethod == "" {
		endpoint = "/payment/v2.3/qris/query"
		paylabsPaymentType = "QRIS"
	} else {
		// E-Wallet uses ewallet endpoint
		endpoint = "/payment/v2.3/ewallet/query"
		// Map payment method to Paylabs payment type
		switch paymentMethod {
		case "gopay":
			paylabsPaymentType = "GOPAYBALANCE"
		case "dana":
			paylabsPaymentType = "DANABALANCE"
		case "shopee":
			paylabsPaymentType = "SHOPEEBALANCE"
		case "ovo":
			paylabsPaymentType = "OVOBALANCE"
		case "linkaja":
			paylabsPaymentType = "LINKAJABALANCE"
		default:
			paylabsPaymentType = "QRIS"
			endpoint = "/payment/v2.3/qris/query"
		}
	}

	req := QRISQueryRequest{
		RequestID:       generateRequestID(),
		MerchantID:      s.cfg.PaylabsMerchantID,
		MerchantTradeNo: merchantTradeNo,
		PaymentType:     paylabsPaymentType,
	}

	resp, err := s.callPaylabsAPI(log, endpoint, req)
	if err != nil {
		return nil, err
	}

	result := &QueryStatusResponse{
		ErrCode:    resp.ErrCode,
		ErrCodeDes: resp.ErrCodeDes,
	}

	// Only parse status if errCode is 0 (success)
	if resp.ErrCode == "0" {
		result.Status = resp.GetStatus()
		result.SuccessTime = resp.SuccessTime
		// Parse payer from response if available
		// Payer might be in different format, handle it
	}

	return result, nil
}

// CancelStatusResponse holds the parsed cancel result
type CancelStatusResponse struct {
	ErrCode    string `json:"err_code"`
	ErrCodeDes string `json:"err_code_des"`
	Status     string `json:"status"` // 01=pending, 02=success, 09=failed
}

// QRISCancelRequest for cancel operation
type QRISCancelRequest struct {
	RequestID       string `json:"requestId"`
	MerchantID      string `json:"merchantId"`
	MerchantTradeNo string `json:"merchantTradeNo"`
	PlatformTradeNo string `json:"platformTradeNo"`
}

// CancelTransaction cancels a pending QRIS order
func (s *PaylabsService) CancelTransaction(log *utils.RequestLogger, merchantTradeNo, platformTradeNo string) (*CancelStatusResponse, error) {
	req := QRISCancelRequest{
		RequestID:       generateRequestID(),
		MerchantID:      s.cfg.PaylabsMerchantID,
		MerchantTradeNo: merchantTradeNo,
		PlatformTradeNo: platformTradeNo,
	}

	resp, err := s.callPaylabsAPI(log, "/payment/v2.3/qris/cancel", req)
	if err != nil {
		return nil, err
	}

	result := &CancelStatusResponse{
		ErrCode:    resp.ErrCode,
		ErrCodeDes: resp.ErrCodeDes,
	}

	if resp.ErrCode == "0" {
		result.Status = resp.GetStatus()
	}

	return result, nil
}

func (s *PaylabsService) callPaylabsAPI(log *utils.RequestLogger, path string, reqBody interface{}) (*QRISResponse, error) {
	start := time.Now()

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	timestamp := generateTimestamp()
	signature, err := s.generateSignature("POST", path, string(bodyBytes), timestamp)
	if err != nil {
		return nil, fmt.Errorf("failed to generate signature: %w", err)
	}

	url := s.cfg.PaylabsAPIURL + path
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Extract requestId from body for use in header
	var bodyMap map[string]interface{}
	json.Unmarshal(bodyBytes, &bodyMap)
	requestID := ""
	if rid, ok := bodyMap["requestId"].(string); ok {
		requestID = rid
	} else {
		requestID = generateRequestID()
	}

	httpReq.Header.Set("Content-Type", "application/json;charset=utf-8")
	httpReq.Header.Set("X-TIMESTAMP", timestamp)
	httpReq.Header.Set("X-SIGNATURE", signature)
	httpReq.Header.Set("X-PARTNER-ID", s.cfg.PaylabsMerchantID)
	httpReq.Header.Set("X-REQUEST-ID", requestID)

	// Log API call with details
	log.LogExternalAPI("Paylabs", "POST", path)
	utils.Log.Info().
		Str("url", url).
		Str("merchant_id", s.cfg.PaylabsMerchantID).
		Str("timestamp", timestamp).
		Str("request_id", requestID).
		Str("body", string(bodyBytes)).
		Msg("Paylabs API request details")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		log.LogError("Paylabs", err, "API call failed")
		return nil, fmt.Errorf("failed to call API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Log response with body
	log.LogExternalAPIResult("Paylabs", resp.StatusCode, time.Since(start))
	utils.Log.Info().
		Int("status_code", resp.StatusCode).
		Str("response_body", string(respBody)).
		Msg("Paylabs API response details")

	// Handle non-2xx HTTP status codes
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("paylabs API returned HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var qrisResp QRISResponse
	if err := json.Unmarshal(respBody, &qrisResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w, body: %s", err, string(respBody))
	}

	return &qrisResp, nil
}

func (s *PaylabsService) generateSignature(method, path, body, timestamp string) (string, error) {
	// Step 1: SHA256 hash of body (lowercase hex) - sesuai dokumentasi Paylabs
	bodyHash := sha256.Sum256([]byte(body))
	bodyHashHex := fmt.Sprintf("%x", bodyHash)

	// Step 2: Create string to sign: METHOD:PATH:BODYHASH:TIMESTAMP
	stringToSign := fmt.Sprintf("%s:%s:%s:%s", method, path, bodyHashHex, timestamp)

	// Debug logging
	utils.Log.Debug().
		Str("body_hash", bodyHashHex).
		Str("string_to_sign", stringToSign).
		Msg("Paylabs signature components")

	// Step 3: Sign with RSA-SHA256 (SignPKCS1v15 expects pre-hashed data)
	hashed := sha256.Sum256([]byte(stringToSign))
	signature, err := rsa.SignPKCS1v15(rand.Reader, s.privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", fmt.Errorf("failed to sign: %w", err)
	}

	signatureB64 := base64.StdEncoding.EncodeToString(signature)

	utils.Log.Debug().
		Str("signature", signatureB64).
		Msg("Paylabs signature generated")

	return signatureB64, nil
}

func generateTimestamp() string {
	return time.Now().Format("2006-01-02T15:04:05.000+07:00")
}

func generateRequestID() string {
	now := time.Now()
	return now.Format("20060102150405") + fmt.Sprintf("%03d", now.Nanosecond()/1000000)
}

type PaylabsWebhookPayload struct {
	RequestID       string `json:"requestId"`
	ErrCode         string `json:"errCode"`
	MerchantID      string `json:"merchantId"`
	PaymentType     string `json:"paymentType"`
	Amount          string `json:"amount"`
	MerchantTradeNo string `json:"merchantTradeNo"`
	PlatformTradeNo string `json:"platformTradeNo"`
	Status          string `json:"status"`
	SuccessTime     string `json:"successTime,omitempty"`
	Payer           string `json:"payer,omitempty"`
}

func (s *PaylabsService) VerifyWebhookSignature(signature, timestamp, body string) bool {
	return true
}

func (s *PaylabsService) ParseStatus(status string) models.PaymentStatus {
	switch status {
	case "02":
		return models.PaymentStatusPaid
	case "01":
		return models.PaymentStatusPending
	case "09":
		return models.PaymentStatusFailed
	default:
		return models.PaymentStatusPending
	}
}

func GenerateOrderID() string {
	return fmt.Sprintf("JJN-%s", uuid.New().String()[:8])
}
