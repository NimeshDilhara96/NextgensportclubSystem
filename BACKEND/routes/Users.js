const router = require("express").Router();
let User = require("../models/User");
const HealthData = require("../models/HealthData"); // Add HealthData import
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

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

// Get user's bookings
router.get('/:id/bookings', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'bookings.facility',
        select: 'name description hours availability'
      });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Map bookings to include facility name
    const bookings = user.bookings.map(booking => {
      return {
        _id: booking._id,
        facilityName: booking.facility ? booking.facility.name : booking.facilityName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        bookedAt: booking.bookedAt
      };
    });
    
    return res.status(200).json({
      status: 'success',
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while fetching bookings'
    });
  }
});

// Get user's bookings by email
router.get('/bookings/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .populate({
        path: 'bookings.facility',
        select: 'name description hours availability'
      });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if user has bookings
    if (!user.bookings || user.bookings.length === 0) {
      return res.status(200).json({
        status: 'success',
        bookings: []
      });
    }
    
    // Map bookings to include facility name
    const bookings = user.bookings.map(booking => {
      return {
        _id: booking._id,
        facilityName: booking.facility ? booking.facility.name : booking.facilityName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        bookedAt: booking.bookedAt
      };
    });
    
    return res.status(200).json({
      status: 'success',
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while fetching bookings'
    });
  }
});

// Update user membership status
router.patch("/updateStatus/:id", async (req, res) => {
  try {
    const { membershipStatus } = req.body;
    
    // Validate the membership status
    if (!membershipStatus || !["active", "inactive", "suspended", "expired", "blocked"].includes(membershipStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid membership status provided"
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { membershipStatus },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    
    res.json({
      status: "success",
      message: `User status updated to ${membershipStatus}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        membershipStatus: user.membershipStatus
      }
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({
      status: "error",
      message: "Server error while updating user status"
    });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check for missing email or password
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required"
      });
    }
    // Find the user by email
    const user = await User.findOne({ email });
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }
    // Check if user is blocked
    if (user.membershipStatus === 'blocked') {
      return res.status(403).json({
        status: "error",
        message: "Your account has been blocked. Please contact the administrator."
      });
    }
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    res.json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      status: "error",
      message: "Server error during login"
    });
  }
});

// Check if user account is blocked
router.get("/checkStatus", auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware
    res.json({
      status: "success",
      membershipStatus: req.user.membershipStatus,
      isBlocked: req.user.membershipStatus === 'blocked'
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({
      status: "error",
      message: "Server error during status check"
    });
  }
});

// Health Data Routes - Add these before module.exports

// Get today's health data for a user
router.route("/health/today/:userEmail").get(async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        // If no data exists for today, create it
        if (!healthData) {
            healthData = new HealthData({
                user: user._id,
                date: today
            });
            
            // Initialize water glasses
            healthData.initializeWaterGlasses();
            await healthData.save();
        }

        res.json({
            status: "success",
            data: healthData,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error fetching health data:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Update water intake - mark glass as completed/uncompleted
router.route("/health/water/:userEmail").put(async (req, res) => {
    try {
        const { glassNumber, completed } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData) {
            healthData = new HealthData({
                user: user._id,
                date: today
            });
            healthData.initializeWaterGlasses();
        }

        // Mark the water glass
        await healthData.markWaterGlass(glassNumber, completed);

        res.json({
            status: "success",
            message: `Water glass ${glassNumber} ${completed ? 'completed' : 'unchecked'}`,
            data: healthData.waterIntake,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error updating water intake:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Update calories burned
router.route("/health/calories/:userEmail").put(async (req, res) => {
    try {
        const { burned, consumed } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOneAndUpdate(
            { user: user._id, date: today },
            { 
                $set: { 
                    ...(burned !== undefined && { 'calories.burned': burned }),
                    ...(consumed !== undefined && { 'calories.consumed': consumed })
                }
            },
            { upsert: true, new: true }
        );

        res.json({
            status: "success",
            message: "Calories updated successfully",
            data: healthData.calories,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error updating calories:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Update steps
router.route("/health/steps/:userEmail").put(async (req, res) => {
    try {
        const { steps } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOneAndUpdate(
            { user: user._id, date: today },
            { $set: { 'steps.current': steps } },
            { upsert: true, new: true }
        );

        res.json({
            status: "success",
            message: "Steps updated successfully",
            data: healthData.steps,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error updating steps:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Add workout session
router.route("/health/workout/:userEmail").post(async (req, res) => {
    try {
        const { name, duration, calories, startTime, endTime } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData) {
            healthData = new HealthData({
                user: user._id,
                date: today
            });
        }

        // Add workout session
        await healthData.addWorkoutSession({
            name,
            duration,
            calories,
            startTime: startTime || new Date(),
            endTime: endTime || new Date(),
            completed: true
        });

        res.json({
            status: "success",
            message: "Workout session added successfully",
            data: healthData.workout,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error adding workout:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Mark workout as completed
router.route("/health/workout/complete/:userEmail").put(async (req, res) => {
    try {
        const { workoutId, completed } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData) {
            return res.json({ status: "error", message: "No health data found for today" });
        }

        // Find and update the specific workout session by index
        const workoutIndex = parseInt(workoutId) - 1; // Convert to 0-based index
        if (workoutIndex < 0 || workoutIndex >= healthData.workout.sessions.length) {
            return res.json({ status: "error", message: "Workout session not found" });
        }

        healthData.workout.sessions[workoutIndex].completed = completed;
        healthData.workout.sessions[workoutIndex].endTime = completed ? new Date() : null;

        // Recalculate totals
        healthData.workout.totalMinutes = healthData.workout.sessions.reduce((total, session) => 
            total + (session.completed ? (session.duration || 0) : 0), 0);
        healthData.workout.totalCalories = healthData.workout.sessions.reduce((total, session) => 
            total + (session.completed ? (session.calories || 0) : 0), 0);

        await healthData.save();

        res.json({
            status: "success",
            message: `Workout ${completed ? 'completed' : 'marked as incomplete'}`,
            data: healthData.workout,
            progress: healthData.getDailyProgress()
        });

    } catch (error) {
        console.error("Error updating workout completion:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Update mood and energy
router.route("/health/mood/:userEmail").put(async (req, res) => {
    try {
        const { mood, energy, notes } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOneAndUpdate(
            { user: user._id, date: today },
            { 
                $set: { 
                    ...(mood && { mood }),
                    ...(energy && { energy }),
                    ...(notes && { notes })
                }
            },
            { upsert: true, new: true }
        );

        res.json({
            status: "success",
            message: "Mood and energy updated successfully",
            data: {
                mood: healthData.mood,
                energy: healthData.energy,
                notes: healthData.notes
            }
        });

    } catch (error) {
        console.error("Error updating mood:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Update BMI
router.route("/health/bmi/:userEmail").put(async (req, res) => {
    try {
        const { bmi } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOneAndUpdate(
            { user: user._id, date: today },
            { $set: { bmi: parseFloat(bmi) } },
            { upsert: true, new: true }
        );

        res.json({
            status: "success",
            message: "BMI updated successfully",
            data: {
                bmi: healthData.bmi
            }
        });

    } catch (error) {
        console.error("Error updating BMI:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Get health data for a date range
router.route("/health/range/:userEmail").get(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const healthData = await HealthData.find({
            user: user._id,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1 });

        res.json({
            status: "success",
            data: healthData,
            count: healthData.length
        });

    } catch (error) {
        console.error("Error fetching health data range:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Generate 7-day workout plan
router.route("/health/workout-plan/generate/:userEmail").post(async (req, res) => {
    try {
        const { goal } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData) {
            healthData = new HealthData({
                user: user._id,
                date: today
            });
        }

        // Generate workout plan
        await healthData.generateWorkoutPlan(goal, user);

        res.json({
            status: "success",
            message: "7-day workout plan generated successfully",
            data: healthData.workoutPlan
        });

    } catch (error) {
        console.error("Error generating workout plan:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Get current workout plan
router.route("/health/workout-plan/:userEmail").get(async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData || !healthData.workoutPlan) {
            return res.json({
                status: "success",
                data: null,
                message: "No workout plan found"
            });
        }

        res.json({
            status: "success",
            data: healthData.workoutPlan
        });

    } catch (error) {
        console.error("Error fetching workout plan:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Mark exercise as completed
router.route("/health/workout-plan/complete/:userEmail").put(async (req, res) => {
    try {
        const { dayNumber, exerciseIndex, completed } = req.body;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let healthData = await HealthData.findOne({
            user: user._id,
            date: today
        });

        if (!healthData || !healthData.workoutPlan) {
            return res.json({ status: "error", message: "No workout plan found" });
        }

        // Mark exercise as completed
        await healthData.markExerciseComplete(dayNumber, exerciseIndex, completed);

        res.json({
            status: "success",
            message: `Exercise ${completed ? 'completed' : 'marked as incomplete'}`,
            data: {
                workoutPlan: healthData.workoutPlan,
                calories: healthData.calories,
                progress: healthData.getDailyProgress()
            }
        });

    } catch (error) {
        console.error("Error updating exercise completion:", error);
        res.json({ status: "error", message: error.message });
    }
});

// Get workout plan history
router.route("/health/workout-plan/history/:userEmail").get(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const user = await User.findOne({ email: req.params.userEmail });
        if (!user) {
            return res.json({ status: "error", message: "User not found" });
        }

        const healthData = await HealthData.find({
            user: user._id,
            date: {
                $gte: new Date(startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            },
            'workoutPlan.days': { $exists: true, $ne: [] }
        }).sort({ date: 1 });

        res.json({
            status: "success",
            data: healthData,
            count: healthData.length
        });

    } catch (error) {
        console.error("Error fetching workout plan history:", error);
        res.json({ status: "error", message: error.message });
    }
});

module.exports = router;
