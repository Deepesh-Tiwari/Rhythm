const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const { Schema, model } = mongoose;
const jwt = require("jsonwebtoken");

const spotifySubSchema = new Schema({
    spotifyId: { type: String, index: true },
    accessToken: { type: String, select: false },    // short-lived
    refreshToken: { type: String, select: false },   // secure storage preferred
    scopes: [String],
    connectedAt: Date
}, { _id: false });

const musicTasteSchema = new Schema({
    topTracks: [{ id: String, name: String, artists: [String], playedAt: Date }],
    topArtists: [{ id: String, name: String }],
    topGenres: [String],
    updatedAt: Date
}, { _id: false });

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 4,
        maxlength: 20
    },
    email: {
        type: String,
        required: function () { return !this.spotify || !this.spotify.spotifyId; }, // optional if spotify signup
        lowercase: true,
        unique: true,
        trim: true,
        select: false
    },
    passwordHash: {
        type: String,
        required: function () { return !this.spotify || !this.spotify.spotifyId; }
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ""
    },
    profilePic: {
        type: String,
        default: "https://example.com/default-avatar.png"
    },
    spotify: {
        type: spotifySubSchema,
        default: {}
    },
    isSpotifyConnected: {
        type: Boolean,
        default: false
    },
    musicTaste: {
        type: musicTasteSchema,
        default: {}
    },

    // quick social counters (denormalized for performance)
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    // preferences & settings
    settings: {
        publicProfile: { type: Boolean, default: true },
        allowInvites: { type: Boolean, default: true },
        votePower: { type: Number, default: 1 }, // optional weighting
        notifications: {
            emailOnRequest: { type: Boolean, default: true },
            emailOnMention: { type: Boolean, default: false }
        }
    },

    roles: { type: [String], default: ['user'] },

    // verification / security
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: Date,

    // activity
    lastSeenAt: Date,
    roomsCreatedCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

userSchema.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
}


userSchema.methods.getJWT = function () {
    const user = this;
    // Payload — only include minimal data
    const payload = {
        _id: user._id,
        username: user.username,
        roles: user.roles || ['user'],
    };
    // Token creation
    const token = jwt.sign(payload, process.env.JWT_SECRET || "shhhhhh", {
        expiresIn: "1d", // expires in 1 day
    });
    return token;
};



module.exports = model('User', userSchema);
