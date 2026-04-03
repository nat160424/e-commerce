package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type ApiControl struct {
	ID              primitive.ObjectID `json:"id"               bson:"_id,omitempty"`
	RouteKey        string             `json:"route_key"        bson:"route_key"`
	Method          string             `json:"method"           bson:"method"`
	Path            string             `json:"path"             bson:"path"`
	Name            string             `json:"name"             bson:"name"`
	Group           string             `json:"group"            bson:"group"`
	Description     string             `json:"description"      bson:"description"`
	Enabled         bool               `json:"enabled"          bson:"enabled"`
	DisabledMessage string             `json:"disabled_message" bson:"disabled_message"`
	UpdatedAt       primitive.DateTime `json:"updated_at"       bson:"updated_at"`
}
