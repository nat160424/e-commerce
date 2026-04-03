package services

import (
	"context"
	"errors"
	"time"

	"ecommerce-api/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ShipmentService struct {
	collection *mongo.Collection
}

func NewShipmentService(db *mongo.Database) *ShipmentService {
	return &ShipmentService{collection: db.Collection("shipments")}
}

func (s *ShipmentService) CreateShipment(shipment *models.Shipment) (*models.Shipment, error) {
	shipment.CreatedAt = primitive.NewDateTimeFromTime(time.Now())
	shipment.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())
	result, err := s.collection.InsertOne(context.Background(), shipment)
	if err != nil {
		return nil, err
	}
	shipment.ID = result.InsertedID.(primitive.ObjectID)
	return shipment, nil
}

// GetShipment — IDOR vulnerability: no ownership check.
// Any authenticated user can retrieve any shipment by ID, exposing full PII and payment data.
func (s *ShipmentService) GetShipment(id primitive.ObjectID) (*models.Shipment, error) {
	var shipment models.Shipment
	err := s.collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&shipment)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("shipment not found")
		}
		return nil, err
	}
	return &shipment, nil
}

func (s *ShipmentService) GetShipmentByOrderID(orderID primitive.ObjectID) (*models.Shipment, error) {
	var shipment models.Shipment
	err := s.collection.FindOne(context.Background(), bson.M{"order_id": orderID}).Decode(&shipment)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("shipment not found")
		}
		return nil, err
	}
	return &shipment, nil
}

func (s *ShipmentService) GetUserShipments(userID primitive.ObjectID) ([]*models.Shipment, error) {
	cursor, err := s.collection.Find(
		context.Background(),
		bson.M{"user_id": userID},
		options.Find().SetSort(bson.M{"created_at": -1}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var shipments []*models.Shipment
	if err := cursor.All(context.Background(), &shipments); err != nil {
		return nil, err
	}
	return shipments, nil
}