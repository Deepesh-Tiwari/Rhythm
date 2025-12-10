const Joi = require("joi");

const thirteenYearsAgo = new Date();
thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

const updateUserSchema = Joi.object({
    // --- ADDED USERNAME VALIDATION ---
    username: Joi.string()
        .alphanum() // Ensures username is alphanumeric (a-z, A-Z, 0-9)
        .min(4)
        .max(20)
        .trim()
        .lowercase()
        .required() // We require it because the frontend will always send it
        .messages({
            "string.alphanum": "Username can only contain letters and numbers.",
            "string.min": "Username must be at least 4 characters long.",
            "string.max": "Username must be at most 20 characters long.",
            "any.required": "Username is required.",
        }),

    displayName: Joi.string()
        .trim()
        .max(50)
        .allow('')
        .messages({
            "string.max": "Display name must be less than 50 characters.",
        }),

    bio: Joi.string()
        .trim()
        .max(300)
        .allow('')
        .messages({
            "string.max": "Bio should not exceed 300 characters.",
        }),

    dateOfBirth: Joi.date()
        .iso()
        .max(thirteenYearsAgo)
        .allow(null, '')
        .messages({
            "date.base": "Please provide a valid date of birth.",
            "date.format": "Date of birth must be in YYYY-MM-DD format.",
            "date.max": "You must be at least 13 years old.",
        }),

    gender: Joi.string()
        .valid("male", "female", "other", "")
        .messages({
            "any.only": "Please select a valid gender option.",
        }),

    profilePic: Joi.string()
        .uri() // Ensures the string is a valid URL format
        .allow('') // Allows the user to clear their profile picture
        .messages({
            "string.uri": "Please provide a valid URL for the profile picture.",
        }),

    location: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .messages({
            "string.max": "Location should not exceed 100 characters.",
        }),

}).strict();

module.exports = { updateUserSchema };