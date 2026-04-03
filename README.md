# 🛒 Data Leakage Incident Handling in E-commerce Platform

This project demonstrates how data leakage incidents can occur in a web-based e-commerce system and how to detect, analyze, and mitigate such security issues.


### 🔧 Technical Features
- RESTful API with JWT authentication
- Image upload and management
- Cart synchronization between guest and authenticated users
- Real-time updates and notifications
- Secure data handling

## 🚀 Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- React Router + Axios
- React Toastify + React Slick

**Backend:**
- Go + Gin Framework
- MongoDB
- JWT Authentication
- Bcrypt + CORS

**Infrastructure:**
- Docker + Docker Compose
- Nginx reverse proxy

## 🛡️ Security Features

- JWT Authentication with secure token handling
- Password hashing with Bcrypt
- CORS protection for cross-origin requests
- XSS protection through React
- Storage and handle token in cookie
- Input validation
- SSL/TLS encryption (just for demo, this project use openssl to generate self-signed certificate)

## 📝 Vulnerability
- Order (used for simulation of vulnerability) `GET /api/orders/:id` - Exposes user_id, shipment_id to unauthenticated visitors.
- Recent orders (used for simulation of vulnerability) `GET /api/orders/recent` - Exposes order_id, user_id, shipment_id to unauthenticated visitors.

### ⚠️ Security Vulnerability Simulation
- IDOR (Insecure Direct Object Reference)
- Data exposure through improperly scoped APIs