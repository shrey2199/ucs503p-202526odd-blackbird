# Second Serving - Frontend

Frontend application for the Second Serving food donation platform.

## Features

- **User authentication**: Signup, Login, OTP Verification, Forgot Password
- **Donor Dashboard**: Create and manage food donations
- **Volunteer Dashboard**: View and accept donations, update delivery status
- **Hunger Spot Dashboard**: View assigned donations, filter, search, and mark as delivered
- **Account Management**: Password change and profile updates for all user types
- **Real-time notifications**: WhatsApp notifications (handled by backend)
- **WhatsApp Sandbox**: Join popup for new users
- **Resend OTP**: With cooldown timer to prevent spam

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
├── components/       # Reusable components
│   ├── Layout.jsx
│   ├── LocationMap.jsx
│   ├── ProtectedRoute.jsx
│   └── SearchableSelect.jsx
├── context/          # React Context providers
│   ├── AuthContext.jsx
│   ├── DarkModeContext.jsx
│   └── ToastContext.jsx
├── pages/            # Page components
│   ├── Home.jsx
│   ├── Signup.jsx
│   ├── VerifyOtp.jsx
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── HungerSpotLogin.jsx
│   ├── DonorDashboard.jsx
│   ├── VolunteerDashboard.jsx
│   ├── HungerSpotDashboard.jsx
│   ├── HungerSpotAccount.jsx
│   ├── UserAccount.jsx
│   └── AcceptDonation.jsx
├── services/         # API service functions
│   ├── api.js
│   ├── authService.js
│   ├── donorService.js
│   ├── volunteerService.js
│   └── hungerSpotService.js
├── config/           # Configuration files
│   └── api.js
├── App.jsx           # Main app component with routing
└── main.jsx          # Entry point
```

## Usage

1. **Sign Up**: Create a new account as either a Donor or Volunteer
   - Join WhatsApp sandbox first (popup appears)
   - Enter your details and location
   - Verify OTP sent to WhatsApp
2. **Login**: Login with your phone number and password
   - Choose account type (Donor/Volunteer)
   - Forgot password option available
3. **Donor**: Create food donations and track their status
   - Select hunger spots on map
   - Choose to deliver yourself or assign to volunteer
4. **Volunteer**: Accept donations and update delivery status
   - View available donations
   - Accept and update delivery status
5. **Hunger Spot**: Login and manage assigned donations
   - View all assigned donations
   - Filter by status and search
   - Mark donations as delivered
6. **Account Management**: Update profile and change password
   - Access via user avatar dropdown
   - Update location, name, and password

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
