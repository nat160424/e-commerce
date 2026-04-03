package services

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"ecommerce-api/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OrderItem struct {
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	Name      string             `bson:"name"       json:"name"`
	Quantity  int                `bson:"quantity"   json:"quantity"`
	Price     float64            `bson:"price"      json:"price"`
}

type Order struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID `bson:"user_id"       json:"user_id"`
	ShipmentID primitive.ObjectID `bson:"shipment_id"   json:"shipment_id,omitempty"`
	Items      []OrderItem        `bson:"items"         json:"items"`
	Total      float64            `bson:"total"         json:"total"`
	Status     string             `bson:"status"        json:"status"`
	CreatedAt  time.Time          `bson:"created_at"    json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at"    json:"updated_at"`
}

type ShipmentInput struct {
	FullName    string             `json:"full_name"    binding:"required"`
	Phone       string             `json:"phone"        binding:"required"`
	Email       string             `json:"email"        binding:"required"`
	Address     string             `json:"address"      binding:"required"`
	Province    string             `json:"province"     binding:"required"`
	Note        string             `json:"note"`
	NationalID  string             `json:"national_id"`
	DateOfBirth string             `json:"date_of_birth"`
	PaymentData models.PaymentData `json:"payment_data" binding:"required"`
}

type OrderService struct {
	collection         *mongo.Collection
	shipmentCollection *mongo.Collection
	productService     *ProductService
}

func NewOrderService(db *mongo.Database, productService *ProductService) *OrderService {
	return &OrderService{
		collection:         db.Collection("orders"),
		shipmentCollection: db.Collection("shipments"),
		productService:     productService,
	}
}

func (s *OrderService) CreateOrder(userID primitive.ObjectID, items []OrderItem, si ShipmentInput, ipAddress string) (*Order, error) {
	var total float64
	for i, item := range items {
		product, err := s.productService.GetProduct(item.ProductID)
		if err != nil {
			return nil, err
		}
		if product.Stock < item.Quantity {
			return nil, errors.New("insufficient stock for product: " + product.Name)
		}
		total += product.Price * float64(item.Quantity)
		items[i].Price = product.Price
		items[i].Name = product.Name
	}

	now := time.Now()
	order := &Order{
		UserID:    userID,
		Items:     items,
		Total:     total,
		Status:    "pending",
		CreatedAt: now,
		UpdatedAt: now,
	}

	orderResult, err := s.collection.InsertOne(context.Background(), order)
	if err != nil {
		return nil, err
	}
	order.ID = orderResult.InsertedID.(primitive.ObjectID)

	// Create shipment with full PII
	trackingCode := fmt.Sprintf("VN%08d", rand.Intn(99999999))
	si.PaymentData.Amount = total
	if si.PaymentData.Status == "" {
		si.PaymentData.Status = "pending"
	}

	shipment := &models.Shipment{
		OrderID:      order.ID,
		UserID:       userID,
		Status:       "pending",
		TrackingCode: trackingCode,
		FullName:     si.FullName,
		Phone:        si.Phone,
		Email:        si.Email,
		Address:      si.Address,
		Province:     si.Province,
		Note:         si.Note,
		NationalID:   si.NationalID,
		DateOfBirth:  si.DateOfBirth,
		PaymentData:  si.PaymentData,
		IPAddress:    ipAddress,
		CreatedAt:    primitive.NewDateTimeFromTime(now),
		UpdatedAt:    primitive.NewDateTimeFromTime(now),
	}

	shipmentResult, err := s.shipmentCollection.InsertOne(context.Background(), shipment)
	if err != nil {
		return nil, err
	}
	shipmentID := shipmentResult.InsertedID.(primitive.ObjectID)
	order.ShipmentID = shipmentID

	// Update order with shipment_id
	_, err = s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": order.ID},
		bson.M{"$set": bson.M{"shipment_id": shipmentID}},
	)
	if err != nil {
		return nil, err
	}

	// Decrement stock
	for _, item := range items {
		if err := s.productService.UpdateStock(item.ProductID, -item.Quantity); err != nil {
			return nil, err
		}
	}

	return order, nil
}

func (s *OrderService) GetUserOrders(userID primitive.ObjectID) ([]*Order, error) {
	cursor, err := s.collection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var orders []*Order
	if err := cursor.All(context.Background(), &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

func (s *OrderService) GetOrder(id primitive.ObjectID) (*Order, error) {
	var order Order
	err := s.collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&order)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("order not found")
		}
		return nil, err
	}
	return &order, nil
}

func (s *OrderService) UpdateOrderStatus(id primitive.ObjectID, status string) (*Order, error) {
	update := bson.M{"$set": bson.M{"status": status, "updated_at": time.Now()}}
	result := s.collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": id},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	var order Order
	if err := result.Decode(&order); err != nil {
		return nil, err
	}
	return &order, nil
}

func (s *OrderService) CancelOrder(id primitive.ObjectID) error {
	order, err := s.GetOrder(id)
	if err != nil {
		return err
	}
	if order.Status != "pending" {
		return errors.New("can only cancel pending orders")
	}
	for _, item := range order.Items {
		if err := s.productService.UpdateStock(item.ProductID, item.Quantity); err != nil {
			return err
		}
	}
	update := bson.M{"$set": bson.M{"status": "cancelled", "updated_at": time.Now()}}
	result, err := s.collection.UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("order not found")
	}
	return nil
}

func (s *OrderService) GetAllOrders(filter bson.M) ([]*Order, error) {
	cursor, err := s.collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var orders []*Order
	if err = cursor.All(context.Background(), &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

// GetRecentOrders is intentionally public-facing.
// VULNERABILITY: The response includes order_id, user_id, and shipment_id, enabling IDOR chain.
func (s *OrderService) GetRecentOrders(limit int64) ([]models.RecentOrder, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$sort", Value: bson.D{{Key: "created_at", Value: -1}}}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "shipments",
			"localField":   "_id",
			"foreignField": "order_id",
			"as":           "shipment",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$shipment",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$addFields", Value: bson.M{
			"buyer_name": bson.M{"$ifNull": []interface{}{"$shipment.full_name", "Khach hang"}},
			//"buyer_city": bson.M{"$ifNull": []interface{}{"$shipment.province", "Viet Nam"}},
			"product_snip": bson.M{"$cond": bson.M{
				"if":   bson.M{"$gt": []interface{}{bson.M{"$size": bson.M{"$ifNull": []interface{}{"$items", []interface{}{}}}}, 0}},
				"then": bson.M{"$arrayElemAt": []interface{}{"$items.name", 0}},
				"else": "San pham",
			}},
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":     1,
			"user_id": 1,
			//"shipment_id": 1,
			"total":      1,
			"status":     1,
			"created_at": 1,
			"buyer_name": 1,
			//"buyer_city":  1,
			"product_snip": 1,
		}}},
	}

	cursor, err := s.collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var orders []models.RecentOrder
	if err = cursor.All(context.Background(), &orders); err != nil {
		return nil, err
	}
	return orders, nil
}
