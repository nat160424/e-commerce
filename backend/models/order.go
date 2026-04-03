package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Order struct {
	ID         primitive.ObjectID `json:"id"          bson:"_id,omitempty"`
	UserID     primitive.ObjectID `json:"user_id"     bson:"user_id"`
	ShipmentID primitive.ObjectID `json:"shipment_id" bson:"shipment_id,omitempty"`
	Status     string             `json:"status"      bson:"status"`
	Total      float64            `json:"total"       bson:"total"`
	Items      []OrderItem        `json:"items"       bson:"items"`
	CreatedAt  primitive.DateTime `json:"created_at"  bson:"created_at"`
	UpdatedAt  primitive.DateTime `json:"updated_at"  bson:"updated_at"`
}

// RecentOrder is the public aggregation view for homepage display.
// VULNERABILITY: exposes order_id, user_id, shipment_id to unauthenticated visitors.
type RecentOrder struct {
	ID          primitive.ObjectID `json:"id"           bson:"_id"`
	UserID      primitive.ObjectID `json:"user_id"      bson:"user_id"`
	ShipmentID  primitive.ObjectID `json:"shipment_id"  bson:"shipment_id"`
	Total       float64            `json:"total"        bson:"total"`
	Status      string             `json:"status"       bson:"status"`
	CreatedAt   primitive.DateTime `json:"created_at"   bson:"created_at"`
	BuyerName   string             `json:"buyer_name"   bson:"buyer_name"`
	BuyerCity   string             `json:"buyer_city"   bson:"buyer_city"`
	ProductSnip string             `json:"product_snip" bson:"product_snip"`
}