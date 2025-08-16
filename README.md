# 🏆 NextGen Sports Club – AI-Powered Sports Club Management Platform

An AI-powered full-stack MERN platform designed to transform sports club operations with **intelligent workout & meal plans**, **real-time communication**, and **automated email systems**.

![GitHub last commit](https://img.shields.io/github/last-commit/NimeshDilhara96/NextgensportclubSystem)
![GitHub repo size](https://img.shields.io/github/repo-size/NimeshDilhara96/NextgensportclubSystem)
![GitHub issues](https://img.shields.io/github/issues/NimeshDilhara96/NextgensportclubSystem)

---

## 🚀 Features

### 🔑 Core Features
- **Multi-Role Authentication** – Secure JWT login for Members, Coaches & Admins
- **Membership Management** – Registration, renewals & dynamic profiles
- **Sports Facilities Booking** – Instant reservations + QR code entry
- **Event Management** – Host tournaments, workshops & sponsored events
- **E-Commerce Store** – Merchandise shop with order management
- **Coach–Member Portal** – Personal training plans & progress tracking
- **Health Data Tracking** – Monitor fitness metrics & diet goals
- **Secure Payments** – Integrated payment gateways
- **Community Hub** – Sports discussions & networking
- **Feedback System** – Collect and analyze feedback

### 🌟 Unique Innovations
- 🔒 **Biometric Login**
- 📲 **QR Code Integration** for bookings & events
- 🤖 **AI Workout Plan Generator** – Personalized 7-day plans
- 🥘 **AI Meal Planner** – Sri Lankan cuisine-focused
- 📧 **Smart Email Automation** – Branded HTML templates
- 🤝 **Sponsorship Workflow**
- 🏐 **Multi-Sport Support**
- 💬 **Real-time Messaging**

---

## 🛠 Technology Stack
**Frontend:** React.js (Modular CSS)  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Email:** Nodemailer + Gmail SMTP  
**Authentication:** JWT + Role-Based Access Control  
**File Handling:** Multer (File uploads & QR generation)  
**Testing:** Jest (Unit & Integration)  





# NextGen Sports Club - Management System

A modern sports club management system with secure biometric authentication powered by MommentX.

## 🚀 Quick Start Guide

### Step 1: Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd nextgensportclub

# Backend dependencies
cd BACKEND
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Setup Environment Variables

Create `.env` file inside `BACKEND/` folder:

```env
# Database
MONGODB_URL=......Replace with Your MongoDB.............................

# Cloudflare Tunnel URL (will update after starting tunnel)
PUBLIC_URL=https://your-tunnel-url.trycloudflare.com

# Email Configuration for MommentX Auth
EMAIL_USER=ADD YOUR Gmail Email ID
EMAIL_PASS=ADD YOUR Gmail App Password

# JWT Secret (use a strong random key)
JWT_SECRET=your_generated_secure_random_key_here

# Server Port
PORT=8070
```

### Step 3: Start Cloudflare Tunnel

**Important**: Start this FIRST before starting your backend server.

Open a new terminal (any folder) and run:

```bash
# Option 1: Using cloudflared (if installed)
cloudflared tunnel --url http://localhost:8070

# Option 2: Using npx (no installation needed)
npx cloudflared tunnel --url http://localhost:8070
```

Wait until you see output like:
```
┌──────────────────────────────────────────────────┐
│ Your quick Tunnel has been created! Visit it at: │
│  https://brooklyn-page-dennis-bible.trycloudflare.com  │
└──────────────────────────────────────────────────┘
```

### Step 4: Update .env with Tunnel URL

1. Copy the full public URL you got (e.g., `https://brooklyn-page-dennis-bible.trycloudflare.com`)
2. Open `BACKEND/.env`
3. Replace the `PUBLIC_URL` value:
   ```env
   PUBLIC_URL=https://brooklyn-page-dennis-bible.trycloudflare.com
   ```
4. Save the file

### Step 5: Start Backend Server

In a new terminal:

```bash
cd BACKEND
npm run dev
# or
node server.js
```

Backend will run on:
- Local: `http://localhost:8070`
- External: `https://your-tunnel-url.trycloudflare.com`

### Step 6: Start Frontend Server

In another terminal:

```bash
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Biometric Authentication Flow

### For Users:
1. **Desktop Login**: Enter email → Click "Login with Biometric"
2. **Mobile Email**: Check email for biometric link
3. **Mobile Auth**: Click link → Use Face ID/Fingerprint
4. **Auto Login**: Desktop automatically logs in

### For Developers:
1. **Send Link**: `POST /biometric/send-biometric-link`
2. **Mobile Auth**: `POST /biometric/confirm-biometric`
3. **Desktop Poll**: `GET /biometric/check-status/:sessionId`

## 📁 Project Structure

```
nextgensportclub/
├── BACKEND/
│   ├── models/
│   │   └── User.js              # User schema with biometric support
│   ├── routes/
│   │   ├── Users.js             # User authentication routes
│   │   └── biometricAuth.js     # Biometric authentication routes
│   ├── public/
│   │   └── biometric-login.html # Mobile biometric page
│   ├── server.js                # Main server file
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   └── components/
│   │       └── Auth/
│   │           ├── login.js     # Login component with biometric
│   │           └── login.module.css
│   └── package.json
└── README.md
```

## 🌟 Features

- **Traditional Login**: Email/password authentication
- **Biometric Login**: Face ID/Fingerprint via mobile
- **Real-time Polling**: Desktop automatically logs in after mobile auth
- **MommentX Security**: Enterprise-grade biometric authentication
- **Responsive Design**: Works on desktop and mobile
- **Session Management**: Secure JWT tokens with expiration

## 🔧 API Endpoints

### Authentication
- `POST /user/login` - Traditional login
- `POST /user/add` - User registration

### Biometric Authentication
- `POST /biometric/send-biometric-link` - Send biometric link to email
- `POST /biometric/confirm-biometric` - Confirm mobile biometric auth
- `GET /biometric/check-status/:sessionId` - Poll for auth completion

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: React.js, Axios, CSS Modules
- **Biometric**: WebAuthn API, MommentX Security
- **Email**: Nodemailer, Gmail SMTP
- **Tunnel**: Cloudflare Tunnel
- **Authentication**: bcryptjs, JWT tokens

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure session management
- **Biometric Auth**: WebAuthn API for biometric verification
- **Session Expiry**: 10-minute biometric session timeout
- **Account Protection**: Blocked user detection
- **Secure Email**: MommentX branded authentication emails

## 📱 Mobile Support

The biometric authentication works on mobile devices with:
- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Unlock
- **WebAuthn**: Modern browsers with biometric support

## 🚨 Troubleshooting

### Common Issues:

1. **"Server configuration error"**
   - Make sure `PUBLIC_URL` is set in `.env`
   - Restart backend after updating `.env`

2. **"Email authentication failed"**
   - Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
   - Ensure Gmail app password is correct

3. **"Biometric not supported"**
   - Use HTTPS (Cloudflare tunnel provides this)
   - Test on mobile device with biometric hardware

4. **"Session expired"**
   - Biometric links expire in 10 minutes
   - Request a new link if expired

### Environment Variables Check:
```bash
# In BACKEND directory
node -e "console.log('PUBLIC_URL:', process.env.PUBLIC_URL)"
```

## 🆘 Support

For issues or questions:
- Email: Nimeshdilhara2001@gmail.com
- Security: Powered by MommentX

---

**Note**: Always keep your Cloudflare tunnel running while using biometric authentication, as mobile devices need to access your local server through the tunnel.
