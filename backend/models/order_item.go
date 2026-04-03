package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type OrderItem struct {
	ProductID primitive.ObjectID `json:"product_id" bson:"product_id"`
	Name      string             `json:"name"       bson:"name"`
	Quantity  int                `json:"quantity"   bson:"quantity"`
	Price     float64            `json:"price"      bson:"price"`
}