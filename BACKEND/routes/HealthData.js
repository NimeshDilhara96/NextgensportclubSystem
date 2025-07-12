const router = require("express").Router();
const HealthData = require("../models/HealthData");
const User = require("../models/User");

// Get today's health data for a user
router.route("/today/:userEmail").get(async (req, res) => {
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
router.route("/water/:userEmail").put(async (req, res) => {
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
router.route("/calories/:userEmail").put(async (req, res) => {
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
router.route("/steps/:userEmail").put(async (req, res) => {
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
router.route("/workout/:userEmail").post(async (req, res) => {
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

// Get health data for a date range
router.route("/range/:userEmail").get(async (req, res) => {
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

// Update mood and energy
router.route("/mood/:userEmail").put(async (req, res) => {
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
router.route("/bmi/:userEmail").put(async (req, res) => {
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

// Mark workout as completed
router.route("/workout/complete/:userEmail").put(async (req, res) => {
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

        // Find and update the specific workout session
        const workoutSession = healthData.workout.sessions.id(workoutId);
        if (!workoutSession) {
            return res.json({ status: "error", message: "Workout session not found" });
        }

        workoutSession.completed = completed;
        workoutSession.endTime = completed ? new Date() : null;

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

module.exports = router;