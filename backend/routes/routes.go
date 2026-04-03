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
	userService := services.NewUserService(db)
	productService := services.NewProductService(db)
	orderService := services.NewOrderService(db, productService)
	categoryService := services.NewCategoryService(db)
	cartService := services.NewCartService(db)
	adminService := services.NewAdminService(db)
	shipmentService := services.NewShipmentService(db)
	apiControlService := services.NewApiControlService(db)

	userController := controllers.NewUserController(userService)
	productController := controllers.NewProductController(productService)
	orderController := controllers.NewOrderController(orderService)
	categoryController := controllers.NewCategoryController(categoryService)
	cartController := controllers.NewCartController(cartService)
	adminController := controllers.NewAdminController(adminService)
	shipmentController := controllers.NewShipmentController(shipmentService)
	apiControlController := controllers.NewApiControlController(apiControlService)

	if err := userService.GenerateAdminAccount(); err != nil {
		panic("Failed to generate admin account: " + err.Error())
	}

	if err := apiControlService.Initialize(); err != nil {
		panic("Failed to initialize API controls: " + err.Error())
	}

	// Helper alias for readability
	ac := func(key string) gin.HandlerFunc {
		return middleware.ApiControl(apiControlService, key)
	}

	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.RateLimitMiddleware(20, time.Second))

	// ── Public routes ────────────────────────────────────────────────────────
	public := r.Group("/api")
	{
		auth := public.Group("/auth")
		{
			auth.POST("/register", ac("auth.register"), userController.Register)
			auth.POST("/login", ac("auth.login"), userController.Login)
			auth.POST("/logout", middleware.Auth(), userController.Logout)
		}

		public.GET("/products", ac("products.list"), productController.ListProducts)
		public.GET("/products/:id", ac("products.get"), productController.GetProduct)
		public.GET("/categories", ac("categories.list"), categoryController.ListCategories)
		public.GET("/categories/:id", ac("categories.get"), categoryController.GetCategory)
		public.GET("/product/image/:id", productController.GetProductImage)
		public.GET("/orders/recent", orderController.GetRecentOrders)
	}

	// ── Protected routes (require JWT) ───────────────────────────────────────
	protected := r.Group("/api")
	protected.Use(middleware.Auth())
	{
		user := protected.Group("/user")
		{
			user.GET("/profile", ac("user.profile"), userController.GetProfile)
			user.PUT("/profile", ac("user.update_profile"), userController.UpdateProfile)

			cart := user.Group("/cart")
			{
				cart.GET("/user-cart", ac("cart.get"), cartController.GetCart)
				cart.POST("/add", ac("cart.add"), cartController.AddToCart)
				cart.PUT("/update", ac("cart.update"), cartController.UpdateCart)
				cart.POST("/merge", cartController.MergeCart)
				cart.POST("/delete", cartController.DeleteCartItem)
			}
		}

		protected.POST("/orders", ac("orders.create"), orderController.CreateOrder)
		protected.GET("/orders", ac("orders.list"), orderController.GetUserOrders)
		protected.GET("/orders/:id", ac("orders.get"), orderController.GetOrder)
		protected.PUT("/orders/:id/status", orderController.UpdateOrderStatus)
		protected.POST("/orders/:id/cancel", ac("orders.cancel"), orderController.CancelOrder)

		protected.GET("/shipments/:id", ac("shipments.get"), shipmentController.GetShipment)
		protected.GET("/shipments", ac("shipments.list"), shipmentController.GetMyShipments)
	}

	// ── Admin routes ─────────────────────────────────────────────────────────
	admin := r.Group("/api/admin")
	admin.Use(middleware.Auth())
	{
		admin.GET("/user-profile/:id", userController.GetUserProfile)
		admin.Use(middleware.AdminAuth())
		{
			admin.GET("/users", userController.ListUsers)
			admin.PUT("/users/:id", userController.UpdateUser)
			admin.DELETE("/users/:id", userController.DeleteUser)
			admin.PUT("/users/:id/role", userController.ChangeUserRole)

			admin.POST("/upload-images", productController.UploadImages)
			admin.POST("/products", productController.CreateProduct)
			admin.PUT("/products/:id", productController.UpdateProduct)
			admin.DELETE("/products/:id", productController.DeleteProduct)

			admin.PUT("/orders/:id/status", orderController.UpdateOrderStatus)
			admin.GET("/orders", orderController.GetAllOrders)

			admin.POST("/categories", categoryController.CreateCategory)
			admin.PUT("/categories/:id", categoryController.UpdateCategory)
			admin.DELETE("/categories/:id", categoryController.DeleteCategory)
			admin.GET("/categories", categoryController.ListCategories)

			admin.GET("/stats", adminController.GetAdminStats)

			// API control management
			admin.GET("/api-controls", apiControlController.GetAll)
			admin.PUT("/api-controls/:key", apiControlController.Update)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
}
