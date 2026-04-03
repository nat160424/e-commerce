package controllers

import (
	"ecommerce-api/models"
	"ecommerce-api/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ApiControlController struct {
	service *services.ApiControlService
}

func NewApiControlController(service *services.ApiControlService) *ApiControlController {
	return &ApiControlController{service: service}
}

// GetAll godoc - GET /api/admin/api-controls
func (c *ApiControlController) GetAll(ctx *gin.Context) {
	controls, err := c.service.GetAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse("Không thể lấy danh sách API controls"))
		return
	}
	ctx.JSON(http.StatusOK, models.NewSuccessResponse(controls, "OK"))
}

// Update godoc - PUT /api/admin/api-controls/:key
func (c *ApiControlController) Update(ctx *gin.Context) {
	routeKey := ctx.Param("key")

	var input struct {
		Enabled         bool   `json:"enabled"`
		DisabledMessage string `json:"disabled_message"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Dữ liệu không hợp lệ"))
		return
	}

	result, err := c.service.Update(routeKey, input.Enabled, input.DisabledMessage)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse("Không tìm thấy API control: "+routeKey))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(result, "Cập nhật thành công"))
}
