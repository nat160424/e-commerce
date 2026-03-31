package routes

import (
	"ecommerce-api/controllers"
	"ecommerce-api/middleware"
	"ecommerce-api/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetupRoutes(r *gin.Engine, db *mongo.Database) {
	// Initialize services
	userService := services.NewUserService(db)
	productService := services.NewProductService(db)
	orderService := services.NewOrderService(db, productService)
	categoryService := services.NewCategoryService(db)
	cartService := services.NewCartService(db)
	adminService := services.NewAdminService(db)

	// Initialize controllers
	userController := controllers.NewUserController(userService)
	productController := controllers.NewProductController(productService)
	orderController := controllers.NewOrderController(orderService)
	categoryController := controllers.NewCategoryController(categoryService)
	cartController := controllers.NewCartController(cartService)
	adminController := controllers.NewAdminController(adminService)
	// Generate admin account
	err := userService.GenerateAdminAccount()
	if err != nil {
		panic("Failed to generate admin account: " + err.Error())
	}

	// Middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.RateLimitMiddleware(20, time.Second))
	// Public routes
	public := r.Group("/api")
	{
		// User routes
		auth := public.Group("/auth")
		{
			auth.POST("/register", userController.Register)
			auth.POST("/login", userController.Login)
			auth.POST("/logout", middleware.Auth(), userController.Logout)
			//auth.POST("/forgot-password", userController.ForgotPassword)
		}

		public.GET("/products", productController.ListProducts)
		public.GET("/products/:id", productController.GetProduct)
		public.GET("/categories", categoryController.ListCategories)
		public.GET("/categories/:id", categoryController.GetCategory)

		public.GET("/product/image/:id", productController.GetProductImage)
	}

	protected := r.Group("/api")
	protected.Use(middleware.Auth())
	{
		user := protected.Group("/user")
		{
			user.GET("/profile", userController.GetProfile)
			user.PUT("/profile", userController.UpdateProfile)

			//cart
			cart := user.Group("/cart")
			{
				cart.GET("/user-cart", cartController.GetCart)
				cart.POST("/add", cartController.AddToCart) //add to cart
				cart.PUT("/update", cartController.UpdateCart)
				cart.POST("/merge", cartController.MergeCart) //merge cart on guest user after login
				cart.POST("/delete", cartController.DeleteCartItem)
			}
		}
		protected.POST("/orders", orderController.CreateOrder)
		protected.GET("/orders", orderController.GetUserOrders)
		protected.GET("/orders/:id", orderController.GetOrder)
		protected.PUT("/orders/:id/status", orderController.UpdateOrderStatus)
		protected.POST("/orders/:id/cancel", orderController.CancelOrder)
	}

	// Admin routes
	admin := r.Group("/api/admin")
	admin.GET("/users", userController.ListUsers)
	admin.Use(middleware.Auth())
	{
		admin.Use(middleware.AdminAuth())
		{
			admin.POST("/upload-images", productController.UploadImages)

			// Product management
			admin.POST("/products", productController.CreateProduct)
			admin.PUT("/products/:id", productController.UpdateProduct)
			admin.DELETE("/products/:id", productController.DeleteProduct)

			// Order management
			admin.PUT("/orders/:id/status", orderController.UpdateOrderStatus)
			admin.GET("/orders", orderController.GetAllOrders)

			// Category management
			admin.POST("/categories", categoryController.CreateCategory)
			admin.PUT("/categories/:id", categoryController.UpdateCategory)
			admin.DELETE("/categories/:id", categoryController.DeleteCategory)
			admin.GET("/categories", categoryController.ListCategories)

			admin.GET("/stats", adminController.GetAdminStats)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})
}
