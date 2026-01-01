const axios = require('axios')

// Credentials for spotify auth calls
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let tokenCache = {
    access_token: null,
    expires_in: null
}

const getSpotifyAppToken = async () => {

    if (tokenCache.access_token && tokenCache.expires_in > Date.now() + 60000) {
        return tokenCache.access_token;
    }

    console.log("Fetching new Spotify App Access Token...");

    try {
        const reqObj = {
            method : "post",
            url : "https://accounts.spotify.com/api/token",
            headers : {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data : {
                grant_type : "client_credentials",
                client_id : CLIENT_ID,
                client_secret : CLIENT_SECRET
            }
        }
        const response = await axios(reqObj);

        const { access_token, expires_in } = response.data;

        // Update the cache
        tokenCache = {
            access_token: access_token,
            expires_in: Date.now() + (expires_in * 1000),
        };

        return access_token;

    } catch (error) {
        console.error("Error fetching Spotify App Token:", error.response ? error.response.data : error.message);
        throw new Error("Could not retrieve Spotify token.");
    }
}

module.exports = getSpotifyAppToken;