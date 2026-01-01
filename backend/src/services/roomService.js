const Room = require("../models/room");
const ShortUniqueId = require("short-unique-id");
const {resolveToYoutube} = require("./youtubeService");


const uid = new ShortUniqueId({length : 6});

const createRoom = async(name, description, isPublic, hostUserId, genres) => {

    let code = uid.randomUUID().toUpperCase();

    const newRoom = new Room({
        name,
        code,
        description,
        isPublic,
        genres: genres || [],
        host: hostUserId,
        activeMembers: [{
            user: hostUserId,
            role: 'host', // Creator is always Host
            socketId: null // Socket will attach later on join
        }]
    });

    return await newRoom.save();
}

const addSongToQueue = async (roomId, spotifyTrack, addedByUserId) => {
    const room = await Room.findById(roomId);
    if (!room) throw new Error("Room not found");

    // console.log("📥 Incoming Track Data:", JSON.stringify(spotifyTrack, null, 2));

    const artistName = spotifyTrack.artist || (spotifyTrack.artists && spotifyTrack.artists[0]?.name) || "Unknown Artist";
    const trackImage = spotifyTrack.image || spotifyTrack.imageUrl; // Fixes the "Image not visible" issue
    const durationMs = spotifyTrack.durationMs || spotifyTrack.duration || 0; // Fixes the "undefinedms" issue

    const youtubeId = await resolveToYoutube(
        spotifyTrack.id, 
        spotifyTrack.name, 
        artistName,
        durationMs
    );

    if (!youtubeId) throw new Error("Could not find playable audio for this track.");

    const queueItem = {
        spotifyId: spotifyTrack.id,
        name: spotifyTrack.name,
        artist: artistName, // or artists[0]
        image: trackImage,
        durationMs: durationMs,
        youtubeId: youtubeId, // <--- The Resolved ID
        addedBy: addedByUserId,
        votes: []
    };

    room.queue.push(queueItem);
    await room.save();

    return room; // Return updated room for Socket broadcast
};

const getRoomSyncState = async (roomId) => {
    const room = await Room.findById(roomId).lean();
    if (!room) return null;

    const playback = room.currentPlayback;
    
    // Logic: How many seconds have passed since startedAt?
    let seekPosition = playback.position || 0;
    if (playback && playback.isPlaying && playback.lastUpdated) {
        const now = Date.now();
        const lastUpdate = new Date(playback.lastUpdated).getTime();
        const elapsed = (now - lastUpdate) / 1000;
        seekPosition += elapsed;
    }

    return {
        ...playback,
        seekPosition: Math.max(0, seekPosition) // Ensure no negative time
    };
};

const playNextSong = async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room) return null;

    // 1. Check Queue
    if (room.queue.length === 0) {
        // Queue empty? Stop playback.
        room.currentPlayback = {
            isPlaying: false,
            skipVotes: [], // Reset votes

            position: 0,
            lastUpdated: Date.now()
        };
    } else {
        // 2. Pop next song
        const nextSong = room.queue.shift(); // Remove first item

        // 3. Update Playback State
        room.currentPlayback = {
            trackId: nextSong.spotifyId,
            youtubeId: nextSong.youtubeId,
            name: nextSong.name,
            artist: nextSong.artist,
            image: nextSong.image,
            isPlaying: true,
            isPaused: false,
            lastUpdated: Date.now(), // T0
            position: 0,
            skipVotes: [] // Reset votes for new song
        };
    }

    await room.save();
    return room;
};

module.exports = {
    createRoom,
    addSongToQueue,
    getRoomSyncState,
    playNextSong
};