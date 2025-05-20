const router = require("express").Router();
let User = require("../models/User");
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Add New User (Register)
router.route("/add").post((req, res) => {
    const name = req.body.name;
    const age = Number(req.body.age);
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role || 'member'; // Default to "member" if no role is provided
    const gender = req.body.gender;
    const contact = req.body.contact;
    const dob = req.body.dob; // Added dob
    const joinDate = new Date(); // Automatically set to current date

    const newUser = new User({
        name,
        age,
        email,
        password,
        role,
        gender,
        contact,
        dob, // Added dob field
        joinDate
    });

    newUser.save()
        .then(() => {
            res.json("Register Success!");
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json("Error: " + err);
        });
});

// Read all users
router.route("/").get((req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json("Error: " + err));
});

// Update user - modified to use email
router.route("/update/:email").put(async (req, res) => {
    const userEmail = req.params.email;

    const { name, age, password, gender, contact, dob } = req.body;

    const updateUser = {
        name,
        age,
        password,
        gender,
        contact,
        dob
    };

    try {
        const user = await User.findOneAndUpdate(
            { email: userEmail },
            updateUser,
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ status: "User not found" });
        }
        
        res.status(200).json({ status: "user updated", user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "Error with updating data", error: err.message });
    }
});

// Delete user - modified to use email
router.route("/delete/:email").delete(async (req, res) => {
    const userEmail = req.params.email;

    try {
        const user = await User.findOneAndDelete({ email: userEmail });
        
        if (!user) {
            return res.status(404).json({ status: "User not found" });
        }
        
        res.status(200).json({ status: "user deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "Error with deleting data", error: err.message });
    }
});

// Get user - modified to use email (can remove since you already have getByEmail)
router.route("/get/:email").get(async (req, res) => {
    const userEmail = req.params.email;

    try {
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            return res.status(404).json({ status: "User not found" });
        }
        
        res.status(200).json({ status: "user fetched", user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: "Error with get data", error: err.message });
    }
});

// Get user by email
router.get("/getByEmail/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ 
        status: "error", 
        message: "User not found" 
      });
    }

    res.status(200).json({
      status: "success",
      user: {
        name: user.name,
        email: user.email,
        contact: user.contact,
        gender: user.gender,
        dob: user.dob,
        age: user.age,
        role: user.role,
        membershipPackage: user.membershipPackage,
        membershipStatus: user.membershipStatus,
        profilePicture: user.profilePicture,
        joinedDate: user.joinedDate
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      status: "error", 
      message: "Server error while fetching user data" 
    });
  }
});

// Update user by email
router.put("/updateByEmail/:email", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ status: "User not found" });
    }
    res.json({ status: "User updated", user });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// Add profile picture upload route
router.put("/updateProfilePicture/:email", upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { profilePicture: req.file.filename },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: "User not found" });
    }

    res.json({ status: "Profile picture updated", user });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// Add this new route to find user by email
router.get("/find/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Associate user with a sport
router.post("/assignSport/:email", async (req, res) => {
  try {
    const { sportId, sportName, startDate, endDate, status } = req.body;
    
    if (!sportId || !sportName) {
      return res.status(400).json({ 
        status: "error", 
        message: "Sport ID and name are required" 
      });
    }

    const sportEntry = {
      sportId,
      sportName,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status: status || "active"
    };

    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { $push: { sports: sportEntry } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ 
      status: "success", 
      message: "User associated with sport successfully",
      user
    });
  } catch (err) {
    console.error("Error associating user with sport:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Remove user from a sport
router.delete("/removeSport/:email/:sportId", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { $pull: { sports: { sportId: req.params.sportId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ 
      status: "success", 
      message: "Sport removed from user successfully",
      user
    });
  } catch (err) {
    console.error("Error removing sport from user:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get all users for a specific sport
router.get("/bySport/:sportId", async (req, res) => {
  try {
    const users = await User.find({
      "sports.sportId": req.params.sportId
    });
    
    res.json({
      status: "success",
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Error fetching users by sport:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
