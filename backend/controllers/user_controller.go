package controllers

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"ecommerce-api/models"
	"ecommerce-api/services"
	"ecommerce-api/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController(userService *services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

func (c *UserController) Register(ctx *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(utils.MessageUserRegisterFail))
		return
	}

	existingUser, err := c.userService.GetUserByEmail(input.Email)
	if err == nil && existingUser != nil {
		ctx.JSON(http.StatusConflict, models.NewErrorResponse(utils.MessageUserRegisterExist))
		return
	}

	user, err := c.userService.CreateUser(input.Name, input.Email, input.Password)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(utils.MessageUserRegisterFail))
		return
	}
	token, err := c.userService.Login(input.Email, input.Password)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(utils.MessageUserLoginFail))
		return
	}
	setCookie(ctx, token)
	ctx.JSON(http.StatusCreated, models.NewSuccessResponse(user, utils.MessageUserRegisterSuccess))
}

func (c *UserController) Login(ctx *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(utils.MessageUserLoginFail))
		return
	}

	token, err := c.userService.Login(input.Email, input.Password)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse(utils.MessageUserLoginFail))
		return
	}

	setCookie(ctx, token)
	ctx.JSON(http.StatusOK, models.NewSuccessResponse(nil, utils.MessageUserLoginSuccess))
}

// func (c *UserController) ForgotPassword(ctx *gin.Context) {
// 	var input struct {
// 		Email string `json:"email" binding:"required,email"`
// 	}

// 	if err := ctx.ShouldBindJSON(&input); err != nil {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	err := c.userService.SendPasswordResetEmail(input.Email)
// 	if err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send password reset email"})
// 		return
// 	}

// 	ctx.JSON(http.StatusOK, gin.H{"message": "Password reset email sent"})
// }

func (c *UserController) GetProfile(ctx *gin.Context) {
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse(utils.MessageUserIDNotFound))
		return
	}

	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(utils.MessageUserIDNotFound))
		return
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(user, utils.MessageFetchUserSuccess))
}

func (c *UserController) UpdateProfile(ctx *gin.Context) {
	userIDStr := ctx.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, models.NewErrorResponse(utils.MessageUserIDNotFound))
		return
	}

	var input struct {
		Name        string `json:"name"`
		CCCD        string `json:"cccd"`
		Address     string `json:"address"`
		Phone       string `json:"phone"`
		PaymentCard string `json:"payment_card"`
		DateOfBirth string `json:"date_of_birth"`
		Gender      string `json:"gender"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, models.NewErrorResponse(err.Error()))
		return
	}

	var dateOfBirth primitive.DateTime
	if input.DateOfBirth != "" {
		parsedTime, err := time.Parse(time.RFC3339, input.DateOfBirth)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, models.NewErrorResponse("Invalid date format"))
			return
		}
		dateOfBirth = primitive.NewDateTimeFromTime(parsedTime)
	}

	user, err := c.userService.UpdateUserProfile(userID, input.Name, input.CCCD, input.Address, input.Phone, input.PaymentCard, dateOfBirth, input.Gender)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.NewErrorResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, user)
}

func (c *UserController) Logout(ctx *gin.Context) {
	ctx.SetCookie("access_token", "", -1, "/", "localhost", false, false)
	ctx.JSON(http.StatusOK, models.NewSuccessResponse(nil, utils.MessageUserLogoutSuccess))
}

func setCookie(ctx *gin.Context, token string) {
	secure, httpOnly := false, false
	isDevelopment := os.Getenv("ENV") == "development"
	if !isDevelopment {
		secure, httpOnly = true, true
	}

	ctx.SetCookie("access_token", token, 3600, "/", "", secure, httpOnly)
}

func (c *UserController) ListUsers(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "20")
	limit, err := strconv.ParseInt(limitStr, 10, 64)
	if err != nil || limit <= 0 {
		limit = 20 // default
	}

	pageStr := ctx.DefaultQuery("page", "1")
	page, err := strconv.ParseInt(pageStr, 10, 64)
	if err != nil || page <= 0 {
		page = 1
	}

	name := ctx.Query("name")
	role := ctx.Query("role")

	users, total, err := c.userService.ListUsers(limit, (page-1)*limit, name, role)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.NewErrorResponse(utils.MessageFetchUserFail))
		return
	}

	totalPages := (total + limit - 1) / limit // Ceiling division

	response := gin.H{
		"users":       users,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	}

	ctx.JSON(http.StatusOK, models.NewSuccessResponse(response, utils.MessageFetchUserSuccess))
}
