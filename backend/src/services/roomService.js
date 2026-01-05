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

const handleUserLeaveRoom = async (roomId, userId, io) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) return null;

        console.log(`👤 User ${userId} leaving room ${room.code}`);

        // 1. Remove user from members list
        const initialLength = room.activeMembers.length;
        room.activeMembers = room.activeMembers.filter(
            m => m.user.toString() !== userId.toString()
        );

        // If user wasn't in the list, just return
        if (room.activeMembers.length === initialLength) return room;

        // 2. Handle Host Migration
        if (room.host.toString() === userId.toString()) {
            if (room.activeMembers.length > 0) {
                // Promote oldest member
                const nextHost = room.activeMembers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))[0];
                room.host = nextHost.user;

                // Update role inside the array
                const memberIdx = room.activeMembers.findIndex(m => m.user.toString() === nextHost.user.toString());
                if (memberIdx !== -1) {
                    room.activeMembers[memberIdx].role = 'host';
                }
                console.log(`👑 Host migrated to ${nextHost.user}`);
            } else {
                // Close room if empty
                console.log("🌑 Room is now empty. Deactivating.");
                room.isActive = false;
            }
        }

        await room.save();

        // 3. Broadcast Update to Room (Only if room is still active)
        if (io && room.isActive) {
            // Populate to get user details for the frontend list
            const updatedRoom = await Room.findById(room._id).populate('activeMembers.user', 'username displayName profilePic');

            io.to(room._id.toString()).emit('room_update', {
                type: 'MEMBERS_UPDATE',
                activeMembers: updatedRoom ? updatedRoom.activeMembers : [],
                newHostId: room.host
            });
        }

        return room;
    } catch (error) {
        console.error("Error in handleUserLeaveRoom:", error);
        throw error;
    }
};

module.exports = {
    createRoom,
    addSongToQueue,
    getRoomSyncState,
    playNextSong,
    handleUserLeaveRoom
};