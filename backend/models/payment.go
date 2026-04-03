package models

// PaymentMethod is kept for backward compatibility.
type PaymentMethod struct {
	Type        string `json:"type"                    bson:"type"`
	Provider    string `json:"provider,omitempty"      bson:"provider,omitempty"`
	Phone       string `json:"phone,omitempty"         bson:"phone,omitempty"`
	CardBrand   string `json:"card_brand,omitempty"    bson:"card_brand,omitempty"`
	Last4       string `json:"last4,omitempty"         bson:"last4,omitempty"`
	BankName    string `json:"bank_name,omitempty"     bson:"bank_name,omitempty"`
	AccountLast string `json:"account_last,omitempty"  bson:"account_last,omitempty"`
}

// PaymentData stores complete payment credentials for a transaction.
// SIMULATION WARNING: Full card number (PAN) and CVV are stored in plaintext — intentional PCI-DSS Level 1 violation for demo.
type PaymentData struct {
	Method        string  `json:"method"                   bson:"method"`
	Status        string  `json:"status"                   bson:"status"`
	Amount        float64 `json:"amount"                   bson:"amount"`
	TransactionID string  `json:"transaction_id,omitempty" bson:"transaction_id,omitempty"`

	// Bank card — full PAN + CVV stored (PCI-DSS violation)
	CardNumber string `json:"card_number,omitempty" bson:"card_number,omitempty"`
	CardHolder string `json:"card_holder,omitempty" bson:"card_holder,omitempty"`
	ExpiryDate string `json:"expiry_date,omitempty" bson:"expiry_date,omitempty"`
	CVV        string `json:"cvv,omitempty"         bson:"cvv,omitempty"`
	BankName   string `json:"bank_name,omitempty"   bson:"bank_name,omitempty"`

	// E-wallet
	WalletPhone    string `json:"wallet_phone,omitempty"    bson:"wallet_phone,omitempty"`
	WalletProvider string `json:"wallet_provider,omitempty" bson:"wallet_provider,omitempty"`
}