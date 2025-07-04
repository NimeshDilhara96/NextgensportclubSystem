const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            // Set to start of today (00:00:00)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    
    // Water Tracking
    waterIntake: {
        target: {
            type: Number,
            default: 8 // Default 8 glasses per day
        },
        current: {
            type: Number,
            default: 0
        },
        glasses: [{
            glassNumber: {
                type: Number,
                required: true
            },
            time: {
                type: Date,
                default: Date.now
            },
            completed: {
                type: Boolean,
                default: false
            }
        }]
    },
    
    // Calories Tracking
    calories: {
        target: {
            type: Number,
            default: 2000
        },
        burned: {
            type: Number,
            default: 0
        },
        consumed: {
            type: Number,
            default: 0
        }
    },
    
    // Steps Tracking
    steps: {
        target: {
            type: Number,
            default: 10000
        },
        current: {
            type: Number,
            default: 0
        }
    },
    
    // Workout Tracking
    workout: {
        targetMinutes: {
            type: Number,
            default: 60
        },
        currentMinutes: {
            type: Number,
            default: 0
        },
        sessions: [{
            name: String,
            duration: Number, // in minutes
            calories: Number,
            startTime: Date,
            endTime: Date,
            completed: {
                type: Boolean,
                default: false
            }
        }]
    },
    
    // Sleep Tracking
    sleep: {
        targetHours: {
            type: Number,
            default: 8
        },
        actualHours: {
            type: Number,
            default: 0
        },
        bedTime: Date,
        wakeTime: Date,
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            default: 'fair'
        }
    },
    
    // Weight Tracking
    weight: {
        current: Number, // in kg
        target: Number,
        unit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        }
    },
    
    // Mood & Energy
    mood: {
        type: String,
        enum: ['very-low', 'low', 'neutral', 'good', 'excellent'],
        default: 'neutral'
    },
    energy: {
        type: String,
        enum: ['very-low', 'low', 'neutral', 'good', 'excellent'],
        default: 'neutral'
    },
    
    // Notes
    notes: {
        type: String,
        maxlength: 500
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one record per user per day
HealthDataSchema.index({ user: 1, date: 1 }, { unique: true });

// Update the updatedAt field before saving
HealthDataSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to initialize water glasses for the day
HealthDataSchema.methods.initializeWaterGlasses = function() {
    if (this.waterIntake.glasses.length === 0) {
        for (let i = 1; i <= this.waterIntake.target; i++) {
            this.waterIntake.glasses.push({
                glassNumber: i,
                completed: false
            });
        }
    }
};

// Method to mark a water glass as completed
HealthDataSchema.methods.markWaterGlass = function(glassNumber, completed = true) {
    const glass = this.waterIntake.glasses.find(g => g.glassNumber === glassNumber);
    if (glass) {
        glass.completed = completed;
        glass.time = completed ? new Date() : null;
        
        // Update current water count
        this.waterIntake.current = this.waterIntake.glasses.filter(g => g.completed).length;
    }
    return this.save();
};

// Method to add workout session
HealthDataSchema.methods.addWorkoutSession = function(sessionData) {
    this.workout.sessions.push(sessionData);
    this.workout.currentMinutes = this.workout.sessions
        .filter(s => s.completed)
        .reduce((total, session) => total + session.duration, 0);
    return this.save();
};

// Method to calculate daily progress
HealthDataSchema.methods.getDailyProgress = function() {
    return {
        water: {
            percentage: Math.round((this.waterIntake.current / this.waterIntake.target) * 100),
            completed: this.waterIntake.current,
            target: this.waterIntake.target
        },
        calories: {
            percentage: Math.round((this.calories.burned / this.calories.target) * 100),
            burned: this.calories.burned,
            target: this.calories.target
        },
        steps: {
            percentage: Math.round((this.steps.current / this.steps.target) * 100),
            current: this.steps.current,
            target: this.steps.target
        },
        workout: {
            percentage: Math.round((this.workout.currentMinutes / this.workout.targetMinutes) * 100),
            minutes: this.workout.currentMinutes,
            target: this.workout.targetMinutes
        }
    };
};

const HealthData = mongoose.model("HealthData", HealthDataSchema);

module.exports = HealthData;