const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 8070;

app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // Removed useCreateIndex and useFindAndModify as they are no longer needed in Mongoose 6+
});

const connection = mongoose.connection;
connection.once("open", () => {
    console.log("Mongodb connection success!");
});

// Importing both UserRouter and AuthRouter
const UserRouter = require("./routes/Users.js");
const AuthRouter = require("./routes/Auth.js"); // Assuming Auth.js is in the routes folder
const adminRouter = require('./routes/admins');
const biometricAuthRouter = require('./routes/biometricAuth'); // Add biometric auth router
const forgotPasswordRoutes = require('./routes/forgotPassword');
const coachRoutes = require('./routes/coaches'); // Add coach routes
const membershipsRoute = require('./routes/memberships');
const notificationsRoute = require('./routes/notifications');
const orderRouter = require('./routes/orders');
const feedbacksRouter = require('./routes/feedbacks'); // Import feedbacks router
const paymentsRoute = require('./routes/payments'); // Import payments router
const trainingPlansRouter = require('./routes/trainingPlans'); // Import training plans router

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from public directory (for biometric-login.html)
app.use(express.static(path.join(__dirname, 'public')));

// Use the routers for specific routes
app.use("/user", UserRouter);  // All user-related routes will now be under /user
app.use("/auth", AuthRouter);  // All auth-related routes will now be under /auth
app.use('/api/admins', adminRouter);
app.use("/biometric", biometricAuthRouter); // All biometric-related routes will now be under /biometric
app.use('/forgot-password', forgotPasswordRoutes); // Add this line
app.use('/coaches', coachRoutes); // Add coach routes
app.use('/memberships', membershipsRoute);
app.use('/notify', notificationsRoute);
app.use('/orders', orderRouter);
app.use('/payments', paymentsRoute); // Use paymentsRoute for /payments

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add this line with other route configurations
app.use('/training-plans', trainingPlansRouter); // Register training plans route
app.use("/posts", require("./routes/posts"));
app.use("/sports", require("./routes/sports"));
app.use("/events", require("./routes/events"));
app.use("/sponsors", require("./routes/sponsors"));
app.use("/products", require("./routes/products"));
app.use("/facilities", require("./routes/Facilityes"));
app.use("/messages", require("./routes/messages"));
app.use("/feedbacks", feedbacksRouter); // Add feedbacks route

// Serve biometric login page directly at root level (for email links)
app.get('/biometric-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'biometric-login.html'));
});

// ✅ Export app for testing
module.exports = app;

// ✅ Only run server if not being imported (i.e., not in test mode)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`server is up and running on port ${PORT}`);
        console.log(`Biometric login page available at: ${process.env.NGROK_URL || `http://localhost:${PORT}`}/biometric-login.html`);
    });
}
