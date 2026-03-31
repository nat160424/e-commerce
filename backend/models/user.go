package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email        string             `json:"email" bson:"email"`
	Password     string             `json:"-" bson:"password"`
	Name         string             `json:"name" bson:"name"`
	Role         string             `json:"role" bson:"role" default:"user"`
	CCCD         string             `json:"cccd" bson:"cccd"`
	Address      string             `json:"address" bson:"address"`
	Phone        string             `json:"phone" bson:"phone"`
	PaymentCard  string             `json:"payment_card" bson:"payment_card"`
	DateOfBirth  primitive.DateTime `json:"date_of_birth" bson:"date_of_birth"`
	Gender       string             `json:"gender" bson:"gender"`
	CreatedAt    primitive.DateTime `json:"created_at" bson:"created_at"`
	UpdatedAt    primitive.DateTime `json:"updated_at" bson:"updated_at"`
}

func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}

func (u *User) SetAdmin() {
	u.Role = "admin"
}
