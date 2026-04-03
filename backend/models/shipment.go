package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Shipment holds delivery info and full PII for an order.
// SIMULATION WARNING: NationalID and PaymentData are stored in plaintext — intentional GDPR/PCI-DSS violation for demo.
type Shipment struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderID      primitive.ObjectID `bson:"order_id"      json:"order_id"`
	UserID       primitive.ObjectID `bson:"user_id"       json:"user_id"`
	Status       string             `bson:"status"        json:"status"`
	TrackingCode string             `bson:"tracking_code" json:"tracking_code"`

	// Delivery info
	FullName string `bson:"full_name" json:"full_name"`
	Phone    string `bson:"phone"     json:"phone"`
	Email    string `bson:"email"     json:"email"`
	Address  string `bson:"address"   json:"address"`
	Province string `bson:"province"  json:"province"`
	Note     string `bson:"note"      json:"note,omitempty"`

	// Sensitive PII — should never be stored in plaintext (GDPR / Vietnam PDPD violation)
	NationalID  string `bson:"national_id"  json:"national_id"`
	DateOfBirth string `bson:"date_of_birth" json:"date_of_birth"`

	// Full payment data — PCI-DSS violation: CVV + full PAN stored in plaintext
	PaymentData PaymentData `bson:"payment_data" json:"payment_data"`

	// Request metadata
	IPAddress string             `bson:"ip_address" json:"ip_address"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
}