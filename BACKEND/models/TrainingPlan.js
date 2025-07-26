const mongoose = require('mongoose');

const trainingPlanSchema = new mongoose.Schema({
    user: { type: String, required: true }, // Store userId as string for compatibility with Sport.js
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
    coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' },
    title: { type: String, required: true },
    description: { type: String },
    sessions: [
        {
            date: Date,
            focus: String,
            completed: { type: Boolean, default: false }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('TrainingPlan', trainingPlanSchema);