const Joi = require("joi");

// Validation schema for updating user profile
const updateUserSchema = Joi.object({
    username: Joi.string()
        .min(4)
        .max(20)
        .trim()
        .messages({
            "string.min": "Username must be at least 4 characters long",
            "string.max": "Username must be at most 20 characters long",
        }),

    displayName: Joi.string()
        .trim()
        .max(50)
        .messages({
            "string.max": "Display name must be less than 50 characters",
        }),

    bio: Joi.string()
        .trim()
        .max(200)
        .messages({
            "string.max": "Bio should not exceed 200 characters",
        }),

    profilePic: Joi.string()
        .uri()
        .messages({
            "string.uri": "Profile picture must be a valid URL",
        }),

    age: Joi.number()
        .integer()
        .min(18)
        .max(100)
        .messages({
            "number.min": "Age must be at least 18",
            "number.max": "Age must be less than or equal to 100",
        }),

    gender: Joi.string()
        .valid("male", "female", "others")
        .messages({
            "any.only": "Gender must be 'male', 'female', or 'others'",
        }),

    // Optional field: user’s preferred music taste (array of genres or artists)
    musicTaste: Joi.array()
        .items(Joi.string().trim().max(50))
        .messages({
            "array.includes": "Music taste entries must be valid strings",
        }),

    // Optional Spotify sync flag (in case user manually disconnects)
    spotify: Joi.object({
        spotifyId: Joi.string().optional(),
        displayName: Joi.string().optional(),
        profileUrl: Joi.string().uri().optional(),
    }).optional(),

}).strict(); // prevents extra fields like email or hashedPassword

module.exports = { updateUserSchema };
