const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const roomSchema = new Schema({

    code : {
        type : String,
        required : true,
        unique : true,
        index : true
    },

    name : {
        type : String,
        required: [true, "Room name is required"], 
        trim: true
    },
    description: String,

    host : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },

    // Privacy & Settings
    isPublic: { type: Boolean, default: true },
    genres: [String], // "Vibe" tags for recommendation engine

    // -------------------------------------------------
    // HYBRID PLAYBACK STATE (Spotify + YouTube)
    // -------------------------------------------------
    currentPlayback: {
        // Spotify Metadata (For UI)
        spotifyId: String,
        name: String,
        artist: String,
        image: String,
        
        // YouTube Data (For Audio)
        youtubeId: String, 
        
        // Sync Logic
        isPlaying: { type: Boolean, default: false },
        startedAt: Date, // Timestamp when the song STARTED (for seek calculation)
    },

    // THE QUEUE (FIFO)
    queue: [{
        // Storing full object to avoid API calls on read
        spotifyId: String,
        name: String,
        artist: String,
        image: String,
        youtubeId: String, // Resolved cache key
        durationMs: Number,
        
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        
        // For Voting Logic
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
    }],

    activeMembers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        socketId: String, // To handle disconnects
        role: { 
            type: String, 
            enum: ['host', 'moderator', 'listener'], 
            default: 'listener' 
        },
        joinedAt: { type: Date, default: Date.now }
    }],

    isActive: { type: Boolean, default: true }
},{ timestamps: true })

roomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = model('Room', roomSchema);
