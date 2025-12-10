const express = require("express")
const bcrypt = require("bcrypt");
const querystring = require("querystring");
const crypto = require("crypto");
const axios = require("axios");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const { validateSignUp } = require("../utils/validation")
const sendEmail = require('../services/emailService');


const authRouter = express.Router();


// Credentials for spotify auth calls
const CLIENT_ID = "9671d752dde54b609fae0ad8b97ea82a";
const CLIENT_SECRET = "aec9ea1c02b04bad8be18880484ced50";
const REDIRECT_URI = "http://127.0.0.1:3000/auth/spotify/callback";
const stateKey = "spotify_auth_state";

const generateRandomString = (length) => {
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

// Helper function to generate a unique username (important for new users)
const generateUniqueUsername = async (displayName) => {
    let username = displayName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (username.length < 4) {
        username = `${username}${Math.random().toString(36).substring(2, 6)}`;
    }
    if (username.length > 20) {
        username = username.substring(0, 20);
    }

    let userExists = await User.findOne({ username: username });
    let attempts = 0;
    while (userExists && attempts < 5) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        username = `${username.substring(0, 15)}_${randomSuffix}`;
        userExists = await User.findOne({ username: username });
        attempts++;
    }
    if (userExists) return `user_${Date.now()}`;
    return username;
};



authRouter.post("/signup", async (req, res) => {

    try {
        const { username, email, password } = req.body;

        // validate the data
        validateSignUp(req);
        //encrypt password
        const rhashedPassword = await bcrypt.hash(password, 10)
        // save the user
        const user = new User({
            username,
            email,
            passwordHash: rhashedPassword,
        });
        // then save it

        await user.save();

        const token = user.getJWT();

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({ message: "SignUp Sucessfull", data: user });

    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

authRouter.post("/login", async (req, res) => {

    try {
        // get user info from body
        const { email, password } = req.body;
        // verify password
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("Invalid Creditials")
        }
        const isValid = await user.isPasswordValid(password);
        if (!isValid) {
            throw new Error("Invalid Credentials");
        }

        const token = user.getJWT();

        //console.log(token);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({ message: "Login Sucessfull", data: user });

    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }

})

authRouter.post("/logout", (req, res) => {

    res.cookie("token", null, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0// 1 day
    });

    res.status(200).json({ message: "log out successfully" });
})

authRouter.get("/spotify", (req, res) => {
    try {

        let state = generateRandomString(16);
        res.cookie(stateKey, state);

        let scope = "user-read-private user-read-email user-top-read user-follow-read user-library-read playlist-read-private";

        const userAuthCodeReqParams = {
            client_id: CLIENT_ID,
            response_type: "code",
            scope: scope,
            redirect_uri: REDIRECT_URI,
            state: state
        }

        res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify(userAuthCodeReqParams));


    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

authRouter.get("/spotify/callback", async (req, res) => {

    try {

        let code = req.query.code || null;

        // state variable protect our app from CSRF attack
        let state = req.query.state || null;
        let storedState = req.cookies ? req.cookies[stateKey] : null;

        console.log(storedState);
        if (state == null || state != storedState) {
            throw new Error("State not matching")
        }

        res.clearCookie(stateKey);

        const userSpotifyTokenRequestObj = {
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            },
            data: {
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI
            }
        }
        const tokenResponse = await axios(userSpotifyTokenRequestObj);
        const { access_token, refresh_token, scope } = tokenResponse.data;


        const userSpotifyProfileRequestObj = {
            method: "get",
            url: "https://api.spotify.com/v1/me",
            headers: {
                "Authorization": "Bearer " + access_token
            },
        }
        const userSpotifyProfileResponse = await axios(userSpotifyProfileRequestObj);
        const spotifyProfile = userSpotifyProfileResponse.data;

        let user;

        // First Try to find user using spotify id
        user = await User.findOne({ "spotify.spotifyId": spotifyProfile.id });

        // If user not found try finding it by email
        if (!user && spotifyProfile.email) {
            user = await User.findOne({ "email": spotifyProfile.email });
        }

        // case I: user already exists update existing data
        if (user) {

            console.log(`Existing user found: ${user.username}. Linking/updating Spotify data.`);

            user.displayName = user.displayName || spotifyProfile.display_name;
            user.profilePic = user.profilePic === "https://i.pinimg.com/736x/9b/c2/33/9bc233d35db1d71eb9f0dbef12a3a2dd.jpg" ? (spotifyProfile.images?.[0]?.url || user.profilePic) : user.profilePic;

            // Always update connection status and Spotify-specific data
            user.isSpotifyConnected = true;
            user.lastSeenAt = new Date();
            user.spotify = {
                spotifyId: spotifyProfile.id,
                accessToken: access_token,
                refreshToken: refresh_token,
                scopes: scope.split(' '),
                connectedAt: new Date(),
                // Storing these is still recommended for future features!
                profileUrl: spotifyProfile.external_urls.spotify,
                product: spotifyProfile.product,
                country: spotifyProfile.country
            };
        }
        // case 2 : new user registering through spotify
        else {

            console.log("New user detected. Creating account from Spotify profile.");
            const newUsername = await generateUniqueUsername(spotifyProfile.display_name);

            user = new User({
                username: newUsername,
                email: spotifyProfile.email, // This can be null if user denies permission
                displayName: spotifyProfile.display_name,
                profilePic: spotifyProfile.images?.[0]?.url,
                isSpotifyConnected: true,
                emailVerified: !!spotifyProfile.email, // Mark as verified if Spotify provides an email
                emailVerifiedAt: spotifyProfile.email ? new Date() : null,
                onboardingStatus: "pending_profile",
                spotify: {
                    spotifyId: spotifyProfile.id,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    scopes: scope.split(' '),
                    connectedAt: new Date(),
                    profileUrl: spotifyProfile.external_urls.spotify,
                    product: spotifyProfile.product,
                    country: spotifyProfile.country
                }
            });
        }

        // save the user
        await user.save();

        const token = user.getJWT();

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        //res.status(200).json({message : "Login Sucessfull", data : user});
        res.redirect(`http://127.0.0.1:5173/spotify-success`);

    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

authRouter.post("/reset-password", async (req, res) => {

    try {

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("Password reset Email sent to user Registed email")
        }

        if (user.spotify && user.spotify.spotifyId && !user.passwordHash) {
            throw new Error("Must Login using spotify only");
        }
        const token = generateRandomString(30);
        console.log(token);

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();



        const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        const emailText = `You are receiving this email because you (or someone else) have requested the reset of a password for your Rhythm account.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetURL}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

        // configure nodemailer for later
        // await sendEmail({
        //     to: user.email,
        //     subject: 'Rhythm - Password Reset Request',
        //     text: emailText,
        // });

        res.status(200).json({ message: "Password reset Email sent to user Registed email" })

    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

authRouter.post("/reset-password/verify", async (req, res) => {
    try {

        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required." });
        }
        // add more checks in future
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Check that the expiry date is in the future
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})


module.exports = authRouter;