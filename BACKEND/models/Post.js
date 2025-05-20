const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    media: [{
        type: String
    }],
    likes: [{
        
        userEmail: String  // Add userEmail field here
    }],
    comments: [{
        userId: String,
        userName: String,
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);