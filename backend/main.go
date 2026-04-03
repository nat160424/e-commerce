package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"ecommerce-api/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	if os.Getenv("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI is not set in environment variables")
	}

	clientOpts := options.Client().
		ApplyURI(mongoURI).
		SetServerSelectionTimeout(25 * time.Second).
		SetConnectTimeout(25 * time.Second)

	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
	}
	defer client.Disconnect(context.Background())

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer pingCancel()
	if err := client.Ping(pingCtx, nil); err != nil {
		log.Fatal("Error pinging MongoDB:", err)
	}
	log.Println("Connected to MongoDB!")

	dbName := os.Getenv("MONGODB_DB")
	if dbName == "" {
		dbName = "ecommerce"
	}

	db := client.Database(dbName)
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatal("Error creating uploads directory:", err)
	}

	r := gin.Default()

	// Trust nginx container on Docker bridge network (private RFC-1918 ranges)
	if err := r.SetTrustedProxies([]string{
		"127.0.0.1",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
	}); err != nil {
		log.Fatal("Error setting trusted proxies:", err)
	}

	r.Static("/uploads", "./uploads")
	routes.SetupRoutes(r, db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
