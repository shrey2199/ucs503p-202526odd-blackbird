# 🍽️ Second Serving

> A digital platform that automates food donation workflows for non-profit organizations, enabling them to effectively utilize volunteer networks and scale operations to reduce food waste.

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Key Highlights](#-key-highlights)
- [Future Enhancements](#-future-enhancements)

## 🎯 Overview

**Second Serving** is a digital platform designed to automate and streamline the food donation process for non-profit organizations. The platform digitalizes the entire workflow from coordination to distribution, enabling organizations to effectively utilize their volunteer networks and scale their operations.

### Need Analysis
Hunger is not a food shortage—it's a distribution issue. Households, restaurants, grocery stores, and food service providers have excess food that often goes to waste, while food banks and non-profit organizations work tirelessly to feed millions of food-insecure people. These organizations are heroes, but they're stretched thin with limited resources.

### Problem Statement
Non-profit organizations face two critical challenges:
- **Manual processes**: Organizations are overwhelmed by time-consuming manual tasks like tracking donations, coordinating volunteers, and distributing food, leading to inefficiencies and errors that limit their capacity.
- **Under-utilization of resources**: Despite having large volunteer networks, non-profits lack the tools to effectively manage donations, resulting in wasted food and inability to scale operations.

### Solution
**Vision**: To digitalize and automate the entire food donation process to significantly reduce food waste.

**How it Works**: Second Serving is a structured service platform that automates the workflow for non-profit organizations from coordination to distribution.

**Key Benefit**: The platform enables organizations to leverage their volunteer networks to retrieve smaller donations from individual households—something that was previously not feasible due to manual workload. By partnering with Second Serving, non-profits can enhance their operations and better serve their communities.

## ✨ Key Features

### 🔐 Authentication & Security
- **OTP-based verification** via Twilio WhatsApp integration
- **JWT-based authentication** with secure token management
- **Role-based access control** (Donor, Volunteer)
- **Phone number normalization** supporting multiple formats
- **Password encryption** using bcryptjs

### 🗺️ Location Services
- **Interactive maps** using Leaflet and React-Leaflet
- **Geospatial queries** for finding nearest hunger spots and volunteers
- **GPS integration** for automatic location detection
- **Google Maps integration** for navigation
- **Real-time coordinate tracking** with draggable map pins

### 🤖 AI-Powered Matching
- **Intelligent food categorization** using Groq AI (Llama 3.3)
- **Target group detection** (young/everyone) for optimal hunger spot matching
- **Automatic category assignment** based on food description

### 📱 Real-Time Notifications
- **WhatsApp notifications** via Twilio for:
  - OTP delivery
  - Donation acceptance requests
  - Status updates
  - Delivery confirmations

### 🎨 User Experience
- **Dark mode** with system preference detection
- **Responsive design** for all device sizes
- **Animated modals** and smooth transitions
- **Custom toast notifications** replacing browser alerts
- **Intuitive dashboards** for donors and volunteers

### 📊 Donation Management
- **Donor dashboard**: Create, track, and manage donations
- **Volunteer dashboard**: Accept donations and update delivery status
- **Status tracking**: Real-time updates (pending → assigned → in transit → delivered)
- **Donor-willing deliveries**: Option for donors to deliver directly to selected hunger spots
- **Hunger spot selection**: Interactive selection of nearest matching hunger spots

### 🏢 Hunger Spot Management
- **Category-based matching** (young/everyone)
- **Capacity tracking** for hunger spots
- **Contact person management**
- **Active/inactive status** control

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern UI library
- **Vite 7.1.7** - Next-generation build tool
- **React Router DOM 7.9.5** - Client-side routing
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **React-Leaflet 5.0.0** - Interactive maps
- **Axios 1.13.2** - HTTP client
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.21.2** - Web framework
- **MongoDB 8.15.2** (Mongoose) - NoSQL database
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Twilio 5.7.1** - WhatsApp messaging
- **Groq SDK 0.26.0** - AI integration
- **bcryptjs 3.0.2** - Password hashing

### Security & Performance
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - NoSQL injection prevention
- **xss-clean** - XSS protection
- **hpp** - HTTP parameter pollution prevention
- **CORS** - Cross-origin resource sharing

### DevOps & Tools
- **Docker** - Containerization support
- **Docker Compose** - Multi-container orchestration
- **MongoDB Atlas** - Cloud database
- **Environment variables** - Configuration management
- **Concurrently** - Run multiple npm scripts simultaneously

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐
│   React SPA     │  ← Frontend (Port 5173)
│   (Vite)        │
└────────┬────────┘
         │ REST API
         │ (JWT Auth)
┌────────▼────────┐
│  Express.js     │  ← Backend (Port 8000)
│  API Server     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───▼───┐
│MongoDB│ │Twilio│ │ Groq AI │ │Maps   │
│ Atlas │ │WhatsApp│ │  API   │ │API    │
└───────┘ └───────┘ └─────────┘ └───────┘
```

### Database Schema
- **Users**: Donors and Volunteers with geospatial location data
- **Food**: Donations with pickup/delivery locations and status tracking
- **HungerSpots**: Locations with capacity, categories, and contact information

### API Structure
- RESTful API design
- Versioned endpoints (`/api/v1/`)
- Protected routes with JWT middleware
- Error handling with custom error classes
- Async/await pattern with error catching utilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB)
- Twilio account with WhatsApp Sandbox access
- Groq API key (for AI features)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/second-serving.git
cd second-serving
```

2. **Install Dependencies**
```bash
# Install root dependencies (concurrently)
npm install

# Install all dependencies (root, backend, frontend)
npm run install:all
```

3. **Environment Configuration**

Create a `.env` file in the **root directory**:
```env
NODE_ENV=development
PORT=8000
DATABASE_URI=your_mongodb_uri
DATABASE_PASSWD=your_mongodb_password
DATABASE_USER=your_mongodb_username

URL_BACKEND=http://localhost:8000
URL_FRONTEND=http://localhost:5173

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_FROM=<twilio_whatsapp_number>

GROQ_API_KEY=your_groq_api_key

# Frontend Configuration (Vite requires VITE_ prefix)
VITE_API_URL=http://localhost:8000/api/v1
```

4. **Start Development Servers**

**Option 1: Run both frontend and backend together (Recommended)**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

5. **Access the Application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`

## 📁 Project Structure

```
second-serving/
├── Backend/
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── donorController.js
│   │   ├── volController.js
│   │   ├── userController.js
│   │   ├── hungerSpotController.js
│   │   └── errorController.js
│   ├── models/              # Database schemas
│   │   ├── userModel.js
│   │   ├── foodModel.js
│   │   └── hungerSpotModel.js
│   ├── routes/              # API routes
│   │   ├── userRoutes.js
│   │   ├── donorRouter.js
│   │   ├── volRouter.js
│   │   └── hungerSpotRouter.js
│   ├── utils/               # Utilities
│   │   ├── aiTargetGroup.js
│   │   ├── phone.js
│   │   ├── appError.js
│   │   └── catchAsync.js
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
│
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── LocationMap.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/         # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── DarkModeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── VerifyOtp.jsx
│   │   │   ├── DonorDashboard.jsx
│   │   │   ├── VolunteerDashboard.jsx
│   │   │   └── AcceptDonation.jsx
│   │   ├── services/        # API service functions
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── donorService.js
│   │   │   └── volunteerService.js
│   │   ├── config/          # Configuration files
│   │   │   └── api.js
│   │   └── App.jsx          # Main app component
│   └── public/              # Static assets
│
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── package.json             # Root package.json (concurrently scripts)
├── .gitignore              # Git ignore rules
└── README.md
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/users/signup` - User registration
- `POST /api/v1/users/verify` - OTP verification
- `POST /api/v1/users/login` - User login

### Donor Endpoints
- `POST /api/v1/donor/donations` - Create donation
- `GET /api/v1/donor/donations` - Get donor's donations
- `GET /api/v1/donor/hunger-spots` - Get nearest hunger spots
- `PATCH /api/v1/donor/donations/:id/status` - Update donation status
- `DELETE /api/v1/donor/donations/:fid` - Cancel donation

### Volunteer Endpoints
- `GET /api/v1/volunteer/donations` - Get available donations
- `GET /api/v1/volunteer/food/:id` - Get donation details
- `POST /api/v1/volunteer/accept/:id` - Accept donation
- `PATCH /api/v1/volunteer/status/:id` - Update delivery status

### Hunger Spot Endpoints
- `GET /api/v1/hunger-spots` - Get all hunger spots
- `POST /api/v1/hunger-spots` - Create hunger spot (admin)

## 🌟 Key Highlights

### Technical Achievements
- ✅ **Full-stack development** with modern JavaScript frameworks
- ✅ **Geospatial queries** using MongoDB 2dsphere indexes for location-based matching
- ✅ **AI integration** for intelligent food categorization
- ✅ **Real-time notifications** via WhatsApp API
- ✅ **Secure authentication** with JWT and OTP verification
- ✅ **Responsive design** with dark mode support
- ✅ **Interactive maps** with Leaflet integration
- ✅ **RESTful API** design with proper error handling
- ✅ **Security best practices** (Helmet, rate limiting, input sanitization)

### Scalability Features
- Modular architecture for easy feature addition
- Database indexing for optimized queries
- Environment-based configuration
- Docker support for containerization
- Cloud-ready MongoDB Atlas integration

### User Experience
- Intuitive dashboards for different user roles
- Real-time status updates
- Interactive map-based location selection
- Custom modal system replacing browser alerts
- Smooth animations and transitions
- Dark mode with system preference detection

## 🔮 Future Enhancements

- [ ] Real-time tracking using WebSockets
- [ ] Mobile applications (React Native)
- [ ] Push notifications
- [ ] Image upload and processing
- [ ] Analytics dashboard for admins
- [ ] Multi-language support
- [ ] Social sharing features
- [ ] Rating and review system
- [ ] Automated route optimization
- [ ] Integration with food delivery APIs

## 🙏 Acknowledgments

- Twilio for WhatsApp API integration
- Groq for AI capabilities
- MongoDB Atlas for cloud database services
- OpenStreetMap for map tiles
- React and Express.js communities

---

<div align="center">
  <p>Made with ❤️ to reduce food waste and fight hunger</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>

