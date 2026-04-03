package services

import (
	"context"
	"ecommerce-api/models"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DefaultControls defines all API endpoints that can be toggled at runtime.
var DefaultControls = []models.ApiControl{
	// Auth
	{RouteKey: "auth.register", Method: "POST", Path: "/api/auth/register", Name: "Đăng ký", Group: "Xác thực", Description: "Đăng ký tài khoản mới", Enabled: true},
	{RouteKey: "auth.login", Method: "POST", Path: "/api/auth/login", Name: "Đăng nhập", Group: "Xác thực", Description: "Đăng nhập vào hệ thống", Enabled: true},
	// Products
	{RouteKey: "products.list", Method: "GET", Path: "/api/products", Name: "Danh sách sản phẩm", Group: "Sản phẩm", Description: "Lấy danh sách tất cả sản phẩm (public)", Enabled: true},
	{RouteKey: "products.get", Method: "GET", Path: "/api/products/:id", Name: "Chi tiết sản phẩm", Group: "Sản phẩm", Description: "Lấy thông tin chi tiết sản phẩm (public)", Enabled: true},
	// Categories
	{RouteKey: "categories.list", Method: "GET", Path: "/api/categories", Name: "Danh sách danh mục", Group: "Danh mục", Description: "Lấy danh sách tất cả danh mục (public)", Enabled: true},
	{RouteKey: "categories.get", Method: "GET", Path: "/api/categories/:id", Name: "Chi tiết danh mục", Group: "Danh mục", Description: "Lấy thông tin danh mục (public)", Enabled: true},
	// User
	{RouteKey: "user.profile", Method: "GET", Path: "/api/user/profile", Name: "Thông tin cá nhân", Group: "Người dùng", Description: "Lấy thông tin profile của user", Enabled: true},
	{RouteKey: "user.update_profile", Method: "PUT", Path: "/api/user/profile", Name: "Cập nhật hồ sơ", Group: "Người dùng", Description: "Cập nhật thông tin cá nhân", Enabled: true},
	// Cart
	{RouteKey: "cart.get", Method: "GET", Path: "/api/user/cart/user-cart", Name: "Xem giỏ hàng", Group: "Giỏ hàng", Description: "Lấy giỏ hàng của user", Enabled: true},
	{RouteKey: "cart.add", Method: "POST", Path: "/api/user/cart/add", Name: "Thêm vào giỏ hàng", Group: "Giỏ hàng", Description: "Thêm sản phẩm vào giỏ hàng", Enabled: true},
	{RouteKey: "cart.update", Method: "PUT", Path: "/api/user/cart/update", Name: "Cập nhật giỏ hàng", Group: "Giỏ hàng", Description: "Thay đổi số lượng sản phẩm trong giỏ", Enabled: true},
	// Orders
	{RouteKey: "orders.create", Method: "POST", Path: "/api/orders", Name: "Tạo đơn hàng", Group: "Đơn hàng", Description: "Tạo đơn hàng mới", Enabled: true},
	{RouteKey: "orders.list", Method: "GET", Path: "/api/orders", Name: "Danh sách đơn hàng", Group: "Đơn hàng", Description: "Lấy danh sách đơn hàng của user", Enabled: true},
	{RouteKey: "orders.get", Method: "GET", Path: "/api/orders/:id", Name: "Chi tiết đơn hàng", Group: "Đơn hàng", Description: "Lấy chi tiết đơn hàng", Enabled: true},
	{RouteKey: "orders.cancel", Method: "POST", Path: "/api/orders/:id/cancel", Name: "Hủy đơn hàng", Group: "Đơn hàng", Description: "Hủy đơn hàng", Enabled: true},
	// Shipments
	{RouteKey: "shipments.get", Method: "GET", Path: "/api/shipments/:id", Name: "Chi tiết vận chuyển", Group: "Vận chuyển", Description: "Lấy thông tin vận chuyển", Enabled: true},
	{RouteKey: "shipments.list", Method: "GET", Path: "/api/shipments", Name: "Danh sách vận chuyển", Group: "Vận chuyển", Description: "Lấy danh sách vận chuyển của user", Enabled: true},
}

type ApiControlService struct {
	collection *mongo.Collection
	cache      map[string]*models.ApiControl
	cacheTime  time.Time
	cacheTTL   time.Duration
	mu         sync.RWMutex
}

func NewApiControlService(db *mongo.Database) *ApiControlService {
	return &ApiControlService{
		collection: db.Collection("api_controls"),
		cacheTTL:   15 * time.Second,
	}
}

func (s *ApiControlService) Initialize() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "route_key", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := s.collection.Indexes().CreateOne(ctx, indexModel); err != nil {
		// Index may already exist - not fatal
	}

	for _, ctrl := range DefaultControls {
		ctrl.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())
		filter := bson.M{"route_key": ctrl.RouteKey}
		update := bson.M{"$setOnInsert": ctrl}
		opts := options.Update().SetUpsert(true)
		if _, err := s.collection.UpdateOne(ctx, filter, update, opts); err != nil {
			return err
		}
	}
	return nil
}

func (s *ApiControlService) GetAll() ([]models.ApiControl, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.collection.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "group", Value: 1}, {Key: "name", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var controls []models.ApiControl
	if err := cursor.All(ctx, &controls); err != nil {
		return nil, err
	}
	return controls, nil
}

func (s *ApiControlService) IsEnabled(routeKey string) bool {
	s.mu.RLock()
	if s.cache != nil && time.Since(s.cacheTime) < s.cacheTTL {
		ctrl, ok := s.cache[routeKey]
		s.mu.RUnlock()
		if !ok {
			return true
		}
		return ctrl.Enabled
	}
	s.mu.RUnlock()

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cache != nil && time.Since(s.cacheTime) < s.cacheTTL {
		if ctrl, ok := s.cache[routeKey]; ok {
			return ctrl.Enabled
		}
		return true
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	cursor, err := s.collection.Find(ctx, bson.M{})
	if err != nil {
		return true
	}
	defer cursor.Close(ctx)

	newCache := make(map[string]*models.ApiControl)
	for cursor.Next(ctx) {
		var c models.ApiControl
		if cursor.Decode(&c) == nil {
			copy := c
			newCache[c.RouteKey] = &copy
		}
	}
	s.cache = newCache
	s.cacheTime = time.Now()

	if ctrl, ok := s.cache[routeKey]; ok {
		return ctrl.Enabled
	}
	return true
}

func (s *ApiControlService) GetDisabledMessage(routeKey string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.cache != nil {
		if ctrl, ok := s.cache[routeKey]; ok {
			return ctrl.DisabledMessage
		}
	}
	return ""
}

func (s *ApiControlService) Update(routeKey string, enabled bool, disabledMessage string) (*models.ApiControl, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"route_key": routeKey}
	update := bson.M{
		"$set": bson.M{
			"enabled":          enabled,
			"disabled_message": disabledMessage,
			"updated_at":       primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var result models.ApiControl
	if err := s.collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&result); err != nil {
		return nil, err
	}

	s.mu.Lock()
	s.cache = nil
	s.mu.Unlock()

	return &result, nil
}
