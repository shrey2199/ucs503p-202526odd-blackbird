# Second Serving - Frontend

Frontend application for the Second Serving food donation platform.

## Features

- User authentication (Signup, Login, OTP Verification)
- Donor Dashboard - Create and manage food donations
- Volunteer Dashboard - View and accept donations, update delivery status
- Real-time notifications via WhatsApp (handled by backend)

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (optional):
```
VITE_API_URL=http://localhost:8000/api/v1
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Project Structure

```
src/
├── components/       # Reusable components (Layout, ProtectedRoute)
├── context/          # React Context (AuthContext)
├── pages/            # Page components
│   ├── Home.jsx
│   ├── Signup.jsx
│   ├── VerifyOtp.jsx
│   ├── Login.jsx
│   ├── DonorDashboard.jsx
│   └── VolunteerDashboard.jsx
├── services/         # API service functions
│   ├── api.js
│   ├── authService.js
│   ├── donorService.js
│   └── volunteerService.js
├── config/           # Configuration files
│   └── api.js
├── App.jsx           # Main app component with routing
└── main.jsx          # Entry point
```

## Usage

1. **Sign Up**: Create a new account as either a Donor or Volunteer
2. **Verify OTP**: Enter the OTP sent to your WhatsApp number
3. **Login**: Login with your phone number and password
4. **Donor**: Create food donations and track their status
5. **Volunteer**: Accept donations and update delivery status

## Backend Integration

Make sure the backend is running on `http://localhost:8000` (or update `VITE_API_URL` in `.env`).

The frontend automatically:
- Adds JWT tokens to API requests
- Handles token expiration (redirects to login)
- Manages authentication state

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.
