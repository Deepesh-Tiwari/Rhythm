const express = require("express");
const { userAuth } = require("../middlewares/authMiddleware");
const getSpotifyAppToken = require("../services/spotifyService");
const { default: axios } = require("axios");
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const { getAudioStream } = require("../services/ytDlpService");
const { spawn } = require("child_process");
const { getCachedAudio }= require('../services/fileCacheService')

const musicRouter = express.Router();

const cookiesPath = path.join(__dirname, '../cookies.json');
let agent = null;


try {
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        agent = ytdl.createAgent(cookies);
        console.log("🍪 YouTube Cookies Loaded Successfully!");
    } else {
        console.warn("⚠️ src/cookies.json not found. Restricted videos might fail.");
    }
} catch (err) {
    console.error("❌ Failed to parse cookies.json:", err.message);
}

let discoveryCache = {
    data: null,
    // Set the expiry time to 0 to ensure it fetches on the first run
    expiresAt: 0
};
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;


musicRouter.get("/search", userAuth, async (req, res) => {

    try {

        const { q, type } = req.query;

        if (!q || !type) {
            return res.status(400).json({ message: "Search query 'q' and 'type' are required." });
        }
        if (!['artist', 'track'].includes(type)) {
            return res.status(400).json({ message: "Search 'type' must be either 'artist' or 'track'." });
        }

        const access_token = await getSpotifyAppToken();

        const searReqObj = {
            method: 'get',
            url: 'https://api.spotify.com/v1/search',
            headers: {
                'Authorization': "Bearer " + access_token
            },
            params: {
                q: q,
                type: type,
                limit: 10
            }
        }

        const searchResponse = await axios(searReqObj);

        let formattedResults = [];
        if (type === 'track' && searchResponse.data.tracks) {
            formattedResults = searchResponse.data.tracks.items.map(item => ({
                id: item.id,
                name: item.name,
                imageUrl: item.album.images[0]?.url || null, // Get the first album image
                duration: item.duration_ms,
                artists: item.artists.map(artist => ({ id: artist.id, name: artist.name, genres: artist.genres }))
            }));
        } else if (type === 'artist' && searchResponse.data.artists) {
            formattedResults = searchResponse.data.artists.items.map(item => ({
                id: item.id,
                name: item.name,
                imageUrl: item.images[0]?.url || null, // Get the first artist image
                genres: item.genres
            }));
        }

        res.status(200).json(formattedResults);

    } catch (error) {
        console.error("Error in proxy search api: ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }
})

musicRouter.get("/discover", userAuth, async (req, res) => {
    // The ID for Spotify's "Today's Top Hits" playlist
    const TRENDING_PLAYLIST_ID = '1SRq3WsxpUl6Q6CQO3g7y9';

    try {

        if (discoveryCache.data && Date.now() < discoveryCache.expiresAt) {
            console.log("Serving discovery data from cache.");
            return res.status(200).json(discoveryCache.data);
        }

        const accessToken = await getSpotifyAppToken();
        const headers = { 'Authorization': `Bearer ${accessToken}` };

        const playlistReqObj = {
            method: "get",
            url: `https://api.spotify.com/v1/playlists/${TRENDING_PLAYLIST_ID}/tracks`,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                limit: 30
            }
        }

        const playlistResponse = await axios(playlistReqObj);

        console.log(playlistReqObj.data);

        const trendingTracksMap = new Map();
        const trendingArtistsMap = new Map();

        playlistResponse.data.items.forEach(item => {
            const track = item.track;
            if (track && !trendingTracksMap.has(track.id)) {

                trendingTracksMap.set(track.id, {
                    id: track.id,
                    name: track.name,
                    imageUrl: track.album.images[0]?.url || null,
                    artists: track.artists.map(artist => ({ id: artist.id, name: artist.name }))
                });

                track.artists.forEach(artist => {
                    if (!trendingArtistsMap.has(artist.id)) {
                        trendingArtistsMap.set(artist.id, { id: artist.id, name: artist.name });
                    }
                });
            }
        });

        let artistIds = Array.from(trendingArtistsMap.keys()).filter(id => id);

        // --- FIX: Implement batching for the artist details API call ---
        if (artistIds.length > 0) {
            const batchSize = 50;
            const artistDetailPromises = [];

            // Create batches of 50
            for (let i = 0; i < artistIds.length; i += batchSize) {
                const batch = artistIds.slice(i, i + batchSize);
                const promise = axios.get('https://api.spotify.com/v1/artists', {
                    headers,
                    params: { ids: batch.join(',') }
                });
                artistDetailPromises.push(promise);
            }

            // Await all the batch requests in parallel
            const responses = await Promise.all(artistDetailPromises);

            // Process the results from all batches
            responses.forEach(response => {
                response.data.artists.forEach(artist => {
                    if (artist && trendingArtistsMap.has(artist.id)) {
                        const artistData = trendingArtistsMap.get(artist.id);

                        artistData.imageUrl = artist.images[0]?.url || null;
                        artistData.genres = artist.genres || [];
                    }
                });
            });
        }

        discoveryCache = {
            data: {
                trendingTracks: Array.from(trendingTracksMap.values()),
                trendingArtists: Array.from(trendingArtistsMap.values())
            },
            expiresAt: Date.now() + CACHE_DURATION_MS
        };
        console.log("Cache updated. It will expire in 4 hours.");

        res.status(200).json({
            trendingTracks: Array.from(trendingTracksMap.values()),
            trendingArtists: Array.from(trendingArtistsMap.values())
        });

    } catch (error) {
        console.error("Error in getDiscoveryList:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "An error occurred while fetching discovery data." });
    }
});

musicRouter.get("/stream/:videoId", async (req, res) => {
  const { videoId } = req.params;

  try {
    console.log(`🎧 Streaming: ${videoId}`);

    const audioStream = await getCachedAudio(videoId);
    const filePath = path.join(__dirname, "../../music_cache", `${videoId}.mp3`);
    const stat = await fs.promises.stat(filePath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    audioStream.pipe(res);

    req.on("close", () => audioStream.destroy());
  } catch (err) {
    console.error("🔥 Stream error:", err.message);
    res.status(500).send("Stream unavailable");
  }
});

module.exports = musicRouter;


