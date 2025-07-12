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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    // Water Tracking
    waterIntake: {
        target: {
            type: Number,
            default: 8
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
        burned: {
            type: Number,
            default: 0
        },
        consumed: {
            type: Number,
            default: 0
        },
        target: {
            type: Number,
            default: 2000
        }
    },
    // Steps Tracking
    steps: {
        current: {
            type: Number,
            default: 0
        },
        target: {
            type: Number,
            default: 10000
        }
    },
    // Workout Tracking
    workout: {
        sessions: [{
            name: {
                type: String,
                required: true
            },
            duration: {
                type: Number,
                required: true
            },
            calories: {
                type: Number,
                default: 0
            },
            startTime: {
                type: Date,
                default: Date.now
            },
            endTime: {
                type: Date
            },
            completed: {
                type: Boolean,
                default: true
            }
        }],
        totalMinutes: {
            type: Number,
            default: 0
        },
        totalCalories: {
            type: Number,
            default: 0
        }
    },
    // 7-Day Workout Plan
    workoutPlan: {
        goal: {
            type: String,
            enum: ['weight_loss', 'muscle_building', 'toning', 'general_fitness'],
            default: 'general_fitness'
        },
        currentDay: {
            type: Number,
            default: 1
        },
        days: [{
            day: {
                type: Number,
                required: true
            },
            exercises: [{
                name: {
                    type: String,
                    required: true
                },
                sets: {
                    type: Number,
                    default: 3
                },
                reps: {
                    type: Number,
                    default: 10
                },
                duration: {
                    type: Number, // in minutes
                    default: 0
                },
                calories: {
                    type: Number,
                    default: 0
                },
                completed: {
                    type: Boolean,
                    default: false
                },
                completedAt: {
                    type: Date
                }
            }],
            totalCalories: {
                type: Number,
                default: 0
            },
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: {
                type: Date
            }
        }],
        totalCalories: {
            type: Number,
            default: 0
        }
    },
    // BMI Tracking
    bmi: {
        type: Number
    },
    // Mood and Energy Tracking
    mood: {
        type: String,
        enum: ['excellent', 'good', 'okay', 'bad', 'terrible']
    },
    energy: {
        type: Number,
        min: 1,
        max: 10
    },
    notes: {
        type: String
    },
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

HealthDataSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Initialize water glasses
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

// Mark water glass as completed/uncompleted
HealthDataSchema.methods.markWaterGlass = function(glassNumber, completed = true) {
    const glass = this.waterIntake.glasses.find(g => g.glassNumber === glassNumber);
    if (glass) {
        glass.completed = completed;
        glass.time = completed ? new Date() : null;
        this.waterIntake.current = this.waterIntake.glasses.filter(g => g.completed).length;
    }
    return this.save();
};

// Add workout session
HealthDataSchema.methods.addWorkoutSession = function(workoutData) {
    this.workout.sessions.push(workoutData);
    
    // Update totals
    this.workout.totalMinutes = this.workout.sessions.reduce((total, session) => 
        total + (session.duration || 0), 0);
    this.workout.totalCalories = this.workout.sessions.reduce((total, session) => 
        total + (session.calories || 0), 0);
    
    return this.save();
};

// Generate 7-day workout plan based on goal
HealthDataSchema.methods.generateWorkoutPlan = function(goal, userProfile) {
    const exercises = this.getExercisesByGoal(goal, userProfile);
    const days = [];
    
    for (let day = 1; day <= 7; day++) {
        const dayExercises = this.getDayExercises(day, exercises, userProfile);
        const totalCalories = dayExercises.reduce((total, exercise) => total + exercise.calories, 0);
        
        days.push({
            day: day,
            exercises: dayExercises,
            totalCalories: totalCalories,
            completed: false
        });
    }
    
    this.workoutPlan = {
        goal: goal,
        currentDay: 1,
        days: days,
        totalCalories: days.reduce((total, day) => total + day.totalCalories, 0)
    };
    
    return this.save();
};

// Get exercises based on goal and user profile
HealthDataSchema.methods.getExercisesByGoal = function(goal, userProfile) {
    const baseExercises = {
        weight_loss: [
            { name: 'Jumping Jacks', calories: 8, sets: 3, reps: 20, duration: 2 },
            { name: 'Burpees', calories: 10, sets: 3, reps: 10, duration: 3 },
            { name: 'Mountain Climbers', calories: 6, sets: 3, reps: 30, duration: 2 },
            { name: 'High Knees', calories: 7, sets: 3, reps: 30, duration: 2 },
            { name: 'Squat Jumps', calories: 9, sets: 3, reps: 15, duration: 2 },
            { name: 'Push-ups', calories: 5, sets: 3, reps: 12, duration: 2 },
            { name: 'Plank', calories: 4, sets: 3, reps: 30, duration: 1 },
            { name: 'Lunges', calories: 6, sets: 3, reps: 20, duration: 2 }
        ],
        muscle_building: [
            { name: 'Push-ups', calories: 5, sets: 4, reps: 15, duration: 3 },
            { name: 'Squats', calories: 6, sets: 4, reps: 20, duration: 3 },
            { name: 'Lunges', calories: 6, sets: 4, reps: 15, duration: 3 },
            { name: 'Plank', calories: 4, sets: 4, reps: 45, duration: 2 },
            { name: 'Wall Sit', calories: 5, sets: 3, reps: 60, duration: 2 },
            { name: 'Tricep Dips', calories: 4, sets: 3, reps: 12, duration: 2 },
            { name: 'Glute Bridges', calories: 5, sets: 4, reps: 20, duration: 2 },
            { name: 'Superman', calories: 3, sets: 3, reps: 15, duration: 2 }
        ],
        toning: [
            { name: 'Push-ups', calories: 4, sets: 3, reps: 10, duration: 2 },
            { name: 'Squats', calories: 5, sets: 3, reps: 15, duration: 2 },
            { name: 'Lunges', calories: 5, sets: 3, reps: 12, duration: 2 },
            { name: 'Plank', calories: 3, sets: 3, reps: 30, duration: 1 },
            { name: 'Bicycle Crunches', calories: 4, sets: 3, reps: 20, duration: 2 },
            { name: 'Russian Twists', calories: 3, sets: 3, reps: 20, duration: 2 },
            { name: 'Glute Bridges', calories: 4, sets: 3, reps: 15, duration: 2 },
            { name: 'Side Plank', calories: 3, sets: 3, reps: 20, duration: 1 }
        ],
        general_fitness: [
            { name: 'Jumping Jacks', calories: 6, sets: 3, reps: 15, duration: 2 },
            { name: 'Push-ups', calories: 4, sets: 3, reps: 10, duration: 2 },
            { name: 'Squats', calories: 5, sets: 3, reps: 15, duration: 2 },
            { name: 'Lunges', calories: 5, sets: 3, reps: 12, duration: 2 },
            { name: 'Plank', calories: 3, sets: 3, reps: 30, duration: 1 },
            { name: 'Mountain Climbers', calories: 5, sets: 3, reps: 20, duration: 2 },
            { name: 'Bicycle Crunches', calories: 4, sets: 3, reps: 15, duration: 2 },
            { name: 'Burpees', calories: 8, sets: 3, reps: 8, duration: 2 }
        ]
    };
    
    return baseExercises[goal] || baseExercises.general_fitness;
};

// Get exercises for a specific day
HealthDataSchema.methods.getDayExercises = function(day, exercises, userProfile) {
    // Shuffle exercises for variety
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 7); // Return 7 exercises per day
};

// Mark exercise as completed
HealthDataSchema.methods.markExerciseComplete = function(dayNumber, exerciseIndex, completed = true) {
    const day = this.workoutPlan.days.find(d => d.day === dayNumber);
    if (day && day.exercises[exerciseIndex]) {
        const exercise = day.exercises[exerciseIndex];
        exercise.completed = completed;
        exercise.completedAt = completed ? new Date() : null;
        
        // Update day completion status
        const allExercisesCompleted = day.exercises.every(ex => ex.completed);
        day.completed = allExercisesCompleted;
        day.completedAt = allExercisesCompleted ? new Date() : null;
        
        // Update calories burned
        if (completed) {
            this.calories.burned += exercise.calories;
        } else {
            this.calories.burned = Math.max(0, this.calories.burned - exercise.calories);
        }
        
        // Update workout plan totals
        this.workoutPlan.totalCalories = this.workoutPlan.days.reduce((total, d) =>
            total + d.exercises.reduce((dayTotal, ex) => 
                dayTotal + (ex.completed ? ex.calories : 0), 0), 0);
    }
    
    return this.save();
};

// Get daily progress summary
HealthDataSchema.methods.getDailyProgress = function() {
    return {
        water: {
            current: this.waterIntake.current,
            target: this.waterIntake.target,
            percentage: Math.round((this.waterIntake.current / this.waterIntake.target) * 100)
        },
        calories: {
            burned: this.calories.burned,
            consumed: this.calories.consumed,
            target: this.calories.target,
            net: this.calories.burned - this.calories.consumed
        },
        steps: {
            current: this.steps.current,
            target: this.steps.target,
            percentage: Math.round((this.steps.current / this.steps.target) * 100)
        },
        workout: {
            sessions: this.workout.sessions.length,
            totalMinutes: this.workout.totalMinutes,
            totalCalories: this.workout.totalCalories
        },
        workoutPlan: {
            currentDay: this.workoutPlan?.currentDay || 0,
            completedDays: this.workoutPlan?.days?.filter(d => d.completed).length || 0,
            totalDays: 7,
            totalCalories: this.workoutPlan?.totalCalories || 0
        }
    };
};

const HealthData = mongoose.model("HealthData", HealthDataSchema);

module.exports = HealthData;