# NextGen Sports Club - Biometric Authentication System

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
MONGODB_URL=mongodb+srv://ftc:ndklanka@nextgensport.q1nxq.mongodb.net/nextgensportsclub?retryWrites=true&w=majority&appName=nextgensport

# Cloudflare Tunnel URL (will update after starting tunnel)
PUBLIC_URL=https://your-tunnel-url.trycloudflare.com

# Email Configuration for MommentX Auth
EMAIL_USER=slcfcricinfo@gmail.com
EMAIL_PASS=muce ujjq qwfh ltez

# JWT Secret (use a strong random key)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_strong_and_random_2024

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
- Email: support@nextgensportsclub.com
- Security: Powered by MommentX

---

**Note**: Always keep your Cloudflare tunnel running while using biometric authentication, as mobile devices need to access your local server through the tunnel.