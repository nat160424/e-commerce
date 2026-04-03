package controllers

import (
	"net/http"

	"ecommerce-api/models"
	"ecommerce-api/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ShipmentController struct {
	shipmentService *services.ShipmentService
}

func NewShipmentController(shipmentService *services.ShipmentService) *ShipmentController {
	return &ShipmentController{shipmentService: shipmentService}
}

// GetShipment — IDOR vulnerability.
// Missing ownership check: any authenticated user can access any shipment by ID.
// Exposes: full_name, phone, email, address, national_id, date_of_birth, payment_data (card number, CVV).
func (c *ShipmentController) GetShipment(ctx *gin.Context) {
	shipmentID, err := primitive.ObjectIDFromHex(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Invalid shipment ID"))
		return
	}

	shipment, err := c.shipmentService.GetShipment(shipmentID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(err.Error()))
		return
	}

	//Check ownership
	// userIDStr := ctx.GetString("userID")
	// userID, err := primitive.ObjectIDFromHex(userIDStr)
	// if err != nil {
	// 	ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse("Invalid user ID"))
	// 	return
	// }
	// if shipment.UserID != userID {
	// 	ctx.JSON(http.StatusForbidden, models.NewErrorResponse("Access denied"))
	// 	return
	// }

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(shipment, "Shipment retrieved"))
}

func (c *ShipmentController) GetMyShipments(ctx *gin.Context) {
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse("Invalid user ID"))
		return
	}

	shipments, err := c.shipmentService.GetUserShipments(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(shipments, "Shipments retrieved"))
}
