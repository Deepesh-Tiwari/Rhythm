const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const messageSchema = new Schema({
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true,
        index: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false
    },
    content: { 
        type: String, 
        required: true, 
        maxlength: 500 
    },
    // Message Types for rich UI
    type: { 
        type: String, 
        enum: ['text', 'system', 'now_playing', 'skip_alert'], 
        default: 'text' 
    }
}, { timestamps: true });

module.exports = model('Message', messageSchema);