const express = require('express');
const { userAuth } = require('../middlewares/authMiddleware')
const { updateUserSchema } = require('../validation/userValidator')
const { publishTasteUpdate } = require('../services/messageQueueService');
const User = require("../models/user");
const axios = require('axios');
const socialRouter = require("./socialRoutes");


// Credentials for spotify auth calls
const CLIENT_ID = "9671d752dde54b609fae0ad8b97ea82a";
const CLIENT_SECRET = "aec9ea1c02b04bad8be18880484ced50";
const REDIRECT_URI = "http://127.0.0.1:3000/auth/spotify/callback";
const stateKey = "spotify_auth_state";

const userRouter = express.Router();

userRouter.get("/me", userAuth, async (req, res) => {

    try {
        const user = req.user;
        res.status(200).json({ message: "response sucessfull", user });
    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

userRouter.patch("/me", userAuth, async (req, res) => {

    try {
        const { err, value } = updateUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

        if (err) {
            const messages = err.details.map(err => err.message).join(', ');
            throw new Error(messages);
        }

        const user = req.user;
        const { username, ...otherUpdates } = value;

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username: username });
            if (existingUser) {
                // Use 409 Conflict status for "resource already exists"
                return res.status(409).json({ message: "Username is already taken." });
            }
            user.username = username;
        }

        Object.assign(user, otherUpdates);

        if (user.onboardingStatus === 'pending_profile') {
            user.onboardingStatus = 'completed';
        }

        await user.save();

        res.status(200).json({ message: "Profile updated successfully", user });

    } catch (err) {

        if (err.code === 11000) {
            return res.status(409).json({ message: "Username is already taken." });
        }

        res.status(500).send("Some Problem with server : " + err.message);
    }

})

userRouter.post("/me/sync-spotify", userAuth, async (req, res) => {

    try {

        const loggedInUserId = req.user.id;

        const userData = await User.findById(loggedInUserId).select('+spotify.refreshToken');;

        if (!userData.isSpotifyConnected) {
            return res.status(400).json({ message: "Please Connect your Spotify for this operation" })
        }
        const REFRESH_TOKEN = userData.spotify.refreshToken;
        const userSpotifyAccessTokenReqObj = {
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: {
                grant_type: "refresh_token",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: REFRESH_TOKEN
            }
        }

        const tokenResponse = await axios(userSpotifyAccessTokenReqObj);
        const { access_token } = tokenResponse.data;

        const getTopTracksObj = {
            method: "get",
            url: "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term",
            headers: {
                "Authorization": "Bearer " + access_token,
            }
        }
        const getTopArtistObj = {
            method: "get",
            url: "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term",
            headers: {
                "Authorization": "Bearer " + access_token,
            }
        }
        const getUserSavedTracksObj = {
            method: "get",
            url: "https://api.spotify.com/v1/me/tracks?limit=50",
            headers: {
                "Authorization": "Bearer " + access_token,
            }
        }
        const getUserFollowedArtistsObj = {
            method: "get",
            url: "https://api.spotify.com/v1/me/following?type=artist&limit=50",
            headers: {
                "Authorization": "Bearer " + access_token,
            }
        }

        // --- Run them all in parallel using Promise.all ---
        const [
            topTracksResponse,
            topArtistsResponse,
            savedTracksResponse,
            followedArtistsResponse
        ] = await Promise.all([
            axios(getTopTracksObj),
            axios(getTopArtistObj),
            axios(getUserSavedTracksObj),
            axios(getUserFollowedArtistsObj)
        ]);


        // Extract data from responses
        const getTopTracksData = topTracksResponse.data.items;
        const getTopArtistData = topArtistsResponse.data.items;
        const getUserSavedTracksData = savedTracksResponse.data.items;
        const getUserFollowedArtistsData = followedArtistsResponse.data.artists.items;

        const topTracksMap = new Map();
        const topArtistsMap = new Map();
        const topGenresSet = new Set();


        getTopTracksData.forEach((track) => {
            if (!topTracksMap.has(track.id)) {
                topTracksMap.set(track.id, {
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map(artist => artist.name),
                    image: track.album.images?.[0]?.url
                });
            }

            track.artists.forEach(artist => {
                if (!topArtistsMap.has(artist.id)) {
                    topArtistsMap.set(artist.id, { id: artist.id, name: artist.name, image: track.album.images?.[0]?.url });
                }
            });
        });

        getTopArtistData.forEach((artist) => {
            if (!topArtistsMap.has(artist.id)) {
                topArtistsMap.set(artist.id, { id: artist.id, name: artist.name, image: artist.images?.[0]?.url });
            }
            artist.genres.forEach(genre => topGenresSet.add(genre));
        });

        getUserSavedTracksData.forEach((item) => {
            const track = item.track;
            if (track && !topTracksMap.has(track.id)) {
                topTracksMap.set(track.id, {
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map(artist => artist.name)
                });
            }
        });

        // Process Followed Artists
        getUserFollowedArtistsData.forEach((artist) => {
            if (!topArtistsMap.has(artist.id)) {
                topArtistsMap.set(artist.id, { id: artist.id, name: artist.name });
            }
            artist.genres.forEach(genre => topGenresSet.add(genre));
        });

        userData.musicTaste = {
            topTracks: Array.from(topTracksMap.values()),
            topArtists: Array.from(topArtistsMap.values()),
            topGenres: Array.from(topGenresSet),
            updatedAt: new Date()
        };

        userData.onboardingStatus = 'pending_profile'
        userData.save();

        publishTasteUpdate(userData._id, userData.musicTaste);

        res.status(200).json({
            message: "Spotify pr synced successfully.",
            musicTaste: userData.musicTaste
        });

    } catch (error) {
        console.error("Error in syncing spotify data : ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }
})

userRouter.post("/me/profile/music", userAuth, async (req, res) => {

    try {
        const loggedInUserId = req.user._id;
        const userData = await User.findById(loggedInUserId);

        if (userData.spotify.spotifyId) {
            return res.status(400).json({ message: "Operation not allowed for user logined through spotify" })
        }

        const { topTracks, topArtists } = req.body;

        if (!topTracks || topTracks.length < 5 || !topArtists || topArtists.length < 5) {
            return res.status(400).json({ message: "Please select at least 5 artists and 5 tracks." });
        }

        const topTracksMap = new Map();
        const topArtistsMap = new Map();
        const topGeneresSet = new Set();

        topTracks.forEach((track) => {

            if (!topTracksMap.has(track.id)) {
                const trackToAdd = {
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map(artist => artist.name),
                    image: track.imageUrl
                }
                topTracksMap.set(track.id, trackToAdd);

                track.artists.forEach((artist) => {
                    if (!topArtistsMap.has(artist.id)) {
                        topArtistsMap.set(artist.id, { id: artist.id, name: artist.name, image: track.imageUrl });
                    }
                })
            }
        })

        topArtists.forEach((artist) => {
            //console.log(artist);
            topArtistsMap.set(artist.id, { id: artist.id, name: artist.name, image: artist.imageUrl, genres: artist.genres });

            if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach((genre) => {
                    topGeneresSet.add(genre);
                })
            }
        })

        userData.musicTaste = {
            topTracks: Array.from(topTracksMap.values()),
            topArtists: Array.from(topArtistsMap.values()),
            topGenres: Array.from(topGeneresSet)
        }

        userData.onboardingStatus = 'pending_profile'

        await userData.save();

        // trigger user music vector update
        publishTasteUpdate(userData._id, userData.musicTaste);

        res.status(200).json({
            message: "Music data saved successfully.",
            musicTaste: userData.musicTaste
        });

    } catch (error) {
        console.error("Error in syncing spotify data : ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }
})

userRouter.patch("/me/profile/music", userAuth, async (req, res) => {

    try {

        const loggedInUserId = req.user._id;
        const userData = await User.findById(loggedInUserId).select("+musicTaste");

        const { topArtists, topTracks } = req.body;

        if (!Array.isArray(topArtists) || !Array.isArray(topTracks) || topArtists.length < 5 || topTracks.length < 5) {
            return res.status(400).json({ message: "Request must include at least 5 artists and 5 tracks." });
        }

        const topGenresSet = new Set();

        topArtists.forEach((artist) => {
            if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach((genre) => topGenresSet.add(genre));
            }
        })

        // to prevent mongo injection attacks on db we should reintialize the topArtist 
        // ans top tracks object
        const finalTopTracks = topTracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name),
            image: track.imageUrl
        }));

        const finalTopArtists = topArtists.map((artist) => {
            //console.log(artist);
            return {
                id: artist.id,
                name: artist.name,
                image: artist.imageUrl,
                genres: artist.genres
            }
        })


        userData.musicTaste = {
            topTracks: finalTopTracks,
            topArtists: finalTopArtists,
            topGenres: Array.from(topGenresSet),
            updatedAt: new Date()
        };

        await userData.save();

        publishTasteUpdate(userData._id, userData.musicTaste);

        res.status(200).json({
            message: "User music taste updated sucessfully",
            musicTaste: userData.musicTaste
        });

    } catch (error) {
        console.error("Error occured while updating music taste : ", error)
        res.status(500).json({ message: "An internal server error occured: " + error.message })
    }
})

// Add social router here to solve issue of 2 router same origin(/users for both user and social router)
userRouter.use(socialRouter);

userRouter.get("/:username", async (req, res) => {
    try {

        const { username } = req.params;
        const userData = await User.findOne({ username: username });

        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "user fetched Sucessfully", userData: userData });

    } catch (error) {
        console.error("Error in fetching user data", error);
        res.status(500).json({ message: "An internal server error occured: " + error.message });

    }
})

userRouter.get("/:username/profile/music", userAuth, async (req, res) => {

    try {
        const { username } = req.params;
        const userData = await User.findOne({ username: username }).select("+musicTaste");

        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "user fetched Sucessfully", userData: userData });

    } catch (error) {
        console.error("Error in fetching user data", error);
        res.status(500).json({ message: "An internal server error occured: " + error.message });

    }
})



module.exports = userRouter;