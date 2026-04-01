package services

import (
	"context"
	"ecommerce-api/models"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	collection *mongo.Collection
}

func NewUserService(db *mongo.Database) *UserService {
	return &UserService{
		collection: db.Collection("users"),
	}
}

func (s *UserService) CreateUser(name, email, password string) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	result, err := s.collection.InsertOne(context.Background(), user)
	if err != nil {
		return nil, err
	}

	user.ID = result.InsertedID.(primitive.ObjectID)
	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := s.collection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByID(id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := s.collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateUserProfile(id primitive.ObjectID, name, cccd, address, phone, paymentCard string, dateOfBirth primitive.DateTime, gender string) (*models.User, error) {
	update := bson.M{
		"$set": bson.M{
			"name":         name,
			"cccd":         cccd,
			"address":      address,
			"phone":        phone,
			"payment_card": paymentCard,
			"date_of_birth": dateOfBirth,
			"gender":       gender,
			"updated_at":   primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	result := s.collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": id},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var user models.User
	if err := result.Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) ComparePassword(user *models.User, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
}

func (s *UserService) GenerateToken(user *models.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	// TODO: Get secret from config
	return token.SignedString([]byte("your_jwt_secret_key_here"))
}

func (s *UserService) Login(email, password string) (string, error) {
	var user models.User
	err := s.collection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func (s *UserService) GenerateAdminAccount() error {
	username := "Admin"
	password := os.Getenv("ADMIN_PASSWORD")
	email := os.Getenv("ADMIN_EMAIL")

	// Check if admin account already exists
	existingUser, err := s.GetUserByEmail(email)
	if err == nil {
		if existingUser.Role == "admin" {
			//check if the password is incorrect and update the password
			if err := s.ComparePassword(existingUser, password); err != nil {
				// Update password
				hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
				if err != nil {
					return err
				}
				_, err = s.collection.UpdateOne(
					context.Background(),
					bson.M{"_id": existingUser.ID},
					bson.M{"$set": bson.M{"password": string(hashedPassword)}},
				)
				if err != nil {
					return err
				}
				return nil
			}
			return nil
		}
	} else {
		//create a new admin account
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		adminUser := &models.User{
			Name:     username,
			Email:    email,
			Password: string(hashedPassword),
			Role:     "admin",
		}
		_, err = s.collection.InsertOne(context.Background(), adminUser)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *UserService) ForgotPassword(email string) (string, error) {
	user, err := s.GetUserByEmail(email)
	if err != nil {
		return "", errors.New("user not found")
	}

	// Generate reset token
	resetToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Minute * 15).Unix(),
	})

	tokenString, err := resetToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *UserService) ListUsers(limit, offset int64, name, role string) ([]models.User, int64, error) {
	filter := bson.M{}

	if name != "" {
		filter["name"] = bson.M{"$regex": name, "$options": "i"}
	}

	if role != "" {
		filter["role"] = role
	}

	// Get total count
	total, err := s.collection.CountDocuments(context.Background(), filter)
	if err != nil {
		return nil, 0, err
	}

	findOptions := options.Find()
	if limit > 0 {
		findOptions.SetLimit(limit)
	}
	if offset > 0 {
		findOptions.SetSkip(offset)
	}
	findOptions.SetSort(bson.M{"created_at": -1}) // Sort by newest first

	var users []models.User
	cursor, err := s.collection.Find(context.Background(), filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var user models.User
		if err := cursor.Decode(&user); err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (s *UserService) DeleteUser(id primitive.ObjectID) error {
	result, err := s.collection.DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

func (s *UserService) ChangeUserRole(id primitive.ObjectID, role string) (*models.User, error) {
	update := bson.M{
		"$set": bson.M{
			"role":       role,
			"updated_at": primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	result := s.collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": id},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var user models.User
	if err := result.Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}
