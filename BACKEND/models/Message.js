const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderRole', // dynamic reference
        required: true
    },
    senderRole: {
        type: String,
        enum: ['Coach', 'User'],
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'receiverRole', // dynamic reference
        required: true
    },
    receiverRole: {
        type: String,
        enum: ['Coach', 'User'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);