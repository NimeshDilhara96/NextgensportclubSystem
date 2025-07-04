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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use the routers for specific routes
app.use("/user", UserRouter);  // All user-related routes will now be under /user
app.use("/auth", AuthRouter);  // All auth-related routes will now be under /auth
app.use('/api/admins', adminRouter);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add this line with other route configurations
app.use("/posts", require("./routes/posts"));
app.use("/sports", require("./routes/sports"));
app.use("/events", require("./routes/events"));
app.use("/sponsors", require("./routes/sponsors"));
app.use("/facilities", require("./routes/Facilityes"));





app.listen(PORT, () => {
    console.log(`server is up and running on port ${PORT}`);
});