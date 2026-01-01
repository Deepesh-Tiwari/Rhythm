const SongMapping = require("../models/songMapping");

let YouTube = require("youtube-sr");
if (YouTube.default) {
    YouTube = YouTube.default;
}

const resolveToYoutube = async (spotifyId, trackName, artistName, spotifyDurationMs) => {
    try {
        // 1. Check Cache
        const cached = await SongMapping.findOne({ spotifyId });
        if (cached) {
            console.log(`✅ Cache Hit: ${trackName}`);
            return cached.youtubeId;
        }

        // 2. Search YouTube
        // Since we use Backend Streaming, we PREFER "Official Audio" for quality.
        // We don't need to hunt for "Lyrics" anymore.
        const query = `${trackName} ${artistName} audio`; 
        console.log(`🔍 Searching YouTube for: "${query}" (Target: ${spotifyDurationMs}ms)`);
        
        // Fetch top 5 results
        const videos = await YouTube.search(query, { limit: 5 });

        if (!videos || videos.length === 0) return null;

        // 3. Simple Duration Matching
        // We want the most relevant result (highest on list) that matches the time.
        const TOLERANCE = 5000; // 5 seconds tolerance (very strict to ensure correct song)
        
        let selectedVideo = videos.find(video => {
            if (!video.duration) return false;
            const diff = Math.abs(video.duration - spotifyDurationMs);
            return diff <= TOLERANCE;
        });

        // Fallback: If no perfect time match, just trust YouTube's ranking algorithms (Index 0)
        if (!selectedVideo) {
            console.warn("⚠️ No exact duration match. Picking top result.");
            selectedVideo = videos[0];
        }

        console.log(`🎯 SELECTED: ${selectedVideo.title} (${selectedVideo.duration}ms)`);

        // 4. Save to Cache
        await SongMapping.create({
            spotifyId,
            youtubeId: selectedVideo.id,
            trackName,
            artistName
        });

        return selectedVideo.id;

    } catch (error) {
        console.error("❌ YouTube Service Error:", error);
        return null; 
    }
};

module.exports = { resolveToYoutube };