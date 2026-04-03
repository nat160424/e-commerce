package controllers

import (
	"net/http"
	"strconv"

	"ecommerce-api/models"
	"ecommerce-api/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderController struct {
	orderService *services.OrderService
}

func NewOrderController(orderService *services.OrderService) *OrderController {
	return &OrderController{orderService: orderService}
}

func (c *OrderController) CreateOrder(ctx *gin.Context) {
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse("Invalid user ID"))
		return
	}

	var input struct {
		Items    []services.OrderItem   `json:"items"    binding:"required"`
		Shipment services.ShipmentInput `json:"shipment" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(err.Error()))
		return
	}

	ipAddress := ctx.ClientIP()
	order, err := c.orderService.CreateOrder(userID, input.Items, input.Shipment, ipAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusCreated, models.NewSuccessResponse(order, "Order created"))
}

func (c *OrderController) GetUserOrders(ctx *gin.Context) {
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse("Invalid user ID"))
		return
	}

	orders, err := c.orderService.GetUserOrders(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(orders, "Orders retrieved"))
}

// GetOrder — IDOR vulnerability.
// Authenticated but missing ownership check: any user can retrieve any order by ID.
// Exposes: user_id, shipment_id, items, total — enabling further IDOR pivots.
func (c *OrderController) GetOrder(ctx *gin.Context) {
	orderID, err := primitive.ObjectIDFromHex(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Invalid order ID"))
		return
	}

	order, err := c.orderService.GetOrder(orderID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(err.Error()))
		return
	}

	//Check ownership
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse("Invalid user ID"))
		return
	}
	if order.UserID != userID {
		ctx.JSON(http.StatusForbidden, models.NewErrorResponse("Access denied"))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(order, "Order retrieved"))
}

func (c *OrderController) UpdateOrderStatus(ctx *gin.Context) {
	orderID, err := primitive.ObjectIDFromHex(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Invalid order ID"))
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(err.Error()))
		return
	}

	order, err := c.orderService.UpdateOrderStatus(orderID, input.Status)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(order, "Status updated"))
}

func (c *OrderController) CancelOrder(ctx *gin.Context) {
	orderID, err := primitive.ObjectIDFromHex(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Invalid order ID"))
		return
	}

	if err := c.orderService.CancelOrder(orderID); err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(nil, "Order cancelled"))
}

func (c *OrderController) GetAllOrders(ctx *gin.Context) {
	filter := bson.M{}
	if status := ctx.Query("status"); status != "" {
		filter["status"] = status
	}
	if startDate := ctx.Query("startDate"); startDate != "" {
		filter["created_at"] = bson.M{"$gte": startDate}
	}
	if endDate := ctx.Query("endDate"); endDate != "" {
		filter["created_at"] = bson.M{"$lte": endDate}
	}

	orders, err := c.orderService.GetAllOrders(filter)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(orders, "All orders retrieved"))
}

// GetRecentOrders is a PUBLIC endpoint (no auth) used for the homepage carousel.
// VULNERABILITY: response includes order_id, user_id, shipment_id — entry point of the IDOR chain.
func (c *OrderController) GetRecentOrders(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "10")
	limit, err := strconv.ParseInt(limitStr, 10, 64)
	if err != nil || limit <= 0 || limit > 50 {
		limit = 10
	}

	orders, err := c.orderService.GetRecentOrders(limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(orders, "Recent orders retrieved"))
}
