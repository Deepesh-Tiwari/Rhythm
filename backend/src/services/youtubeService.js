const SongMapping = require('../models/songMapping');
let YouTube = require("youtube-sr");
if (YouTube.default) {
    YouTube = YouTube.default;
}


const resolveToYoutube = async (spotifyId, trackName, artistName) => {
    try {

        const cached = await SongMapping.findOne({ spotifyId });

        if(cached){
            cached.lastAccessed = Date.now();
            await cached.save();
            return cached.youtubeId;
        }

        const query = `${trackName} ${artistName} audio`;
        const video = await YouTube.searchOne(query);

        if (!video || !video.id) {
            console.warn(`Youtube failed for: ${query}`);
            return null; // Handle graceful failure in UI
        }

        await SongMapping.create({
            spotifyId,
            youtubeId: video.id,
            trackName,
            artistName
        });

        return video.id;
        
    } catch (error) {
        console.error("YouTube Service Error:", error);
        return null;
    }
}

module.exports = { resolveToYoutube };


