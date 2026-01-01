const express = require('express');
const { userAuth } = require("../middlewares/authMiddleware");
const Room = require('../models/room');
const Message = require('../models/message');
const { addSongToQueue, playNextSong } = require('../services/roomService');
const { getCachedAudio } = require('../services/fileCacheService');



const playbackRouter = express.Router({ mergeParams: true });

playbackRouter.post("/queue", userAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const { spotifyTrack } = req.body;

        if (!spotifyTrack || !spotifyTrack.id) {
            return res.status(400).json({ message: "Invalid track data. 'id' is required." });
        }

        // 1. Find the Room
        let room = await Room.findOne({ code, isActive: true });
        if (!room) {
            return res.status(404).json({ message: "Room not found or inactive." });
        }

        // 2. Add Song to Queue
        const updatedRoom = await addSongToQueue(room._id, spotifyTrack, req.user._id);

        const addedSong = updatedRoom.queue[updatedRoom.queue.length - 1];

        if (addedSong && addedSong.youtubeId) {
            console.log(`⚡ Triggering background download for: ${addedSong.name}`);
            
            // Call the function WITHOUT await so UI doesn't freeze
            getCachedAudio(addedSong.youtubeId)
                .then((stream) => {
                    // Important: We just wanted to trigger the download side-effect.
                    // We don't need to read the file right now.
                    // Destroy the stream to close the file handle immediately.
                    if(stream && stream.destroy) stream.destroy();
                })
                .catch(err => {
                    console.error(`❌ Prefetch failed for ${addedSong.name}:`, err.message);
                });
        }

        // 3. AUTO-PLAY LOGIC (The Missing Piece) 🧩
        // Check if the player is currently empty/idle
        const isIdle = !updatedRoom.currentPlayback || !updatedRoom.currentPlayback.youtubeId;

        if (isIdle) {
            console.log(`🚀 Queue was empty. Auto-playing first song.`);

            // Move song from Queue -> CurrentPlayback
            const playingRoom = await playNextSong(room._id);

            if (playingRoom && playingRoom.currentPlayback && playingRoom.currentPlayback.youtubeId) {
                const io = req.app.get('io');
                const serverTime = Date.now();
                const nextTrack = playingRoom.currentPlayback;

                // Set Anchor Point in DB
                await Room.findByIdAndUpdate(room._id, {
                    'currentPlayback.isPlaying': true,
                    'currentPlayback.lastUpdated': serverTime,
                    'currentPlayback.position': 0,
                    'currentPlayback.skipVotes': []
                });

                // ⚡ Broadcast START to all clients
                io.to(room._id.toString()).emit('playback_sync', {
                    action: 'play',
                    youtubeId: nextTrack.youtubeId,
                    seekTime: 0,
                    serverTime,
                    name: nextTrack.name,
                    artist: nextTrack.artist,
                    image: nextTrack.image
                });

                try {
                    const systemMsg = new Message({
                        room: room._id,
                        sender: null,
                        content: `🎵 Now Playing: ${nextTrack.name} - ${nextTrack.artist}`,
                        type: 'system'
                    });
                    await systemMsg.save();
                    io.to(room._id.toString()).emit('new_message', systemMsg);
                } catch (msgErr) {
                    console.error("System Msg Error:", msgErr);
                }

                // Update local variable for response
                room = playingRoom;
            }
        } else {
            // Just update local variable
            room = updatedRoom;
        }

        // 4. Broadcast Queue Update
        const io = req.app.get('io');
        io.to(room._id.toString()).emit('queue_update', {
            queue: room.queue
        });

        // 5. Send Response
        res.status(200).json({
            message: isIdle ? "Song added and auto-playing!" : "Song added to queue",
            queue: room.queue,
            currentPlayback: room.currentPlayback
        });

    } catch (error) {
        console.error("Add to Queue Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

playbackRouter.post("/vote", userAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        const playback = room.currentPlayback;

        if (!playback || !playback.youtubeId) {
            return res.status(400).json({ message: "Nothing is playing to vote on." });
        }

        if (room.host.toString() === userId.toString()) {
            console.log(`👑 Host ${userId} force-skipped via HTTP.`);
            await executeSkip(req, res, room);
            return;
        }

        // --- Listener Logic (Vote) ---

        // Initialize skipVotes if missing
        if (!playback.skipVotes) playback.skipVotes = [];

        // Check if already voted
        const alreadyVoted = playback.skipVotes.includes(userId);
        if (alreadyVoted) {
            return res.status(400).json({ message: "You have already voted." });
        }

        playback.skipVotes.push(userId);

        // Calculate Threshold (50% of active members)
        const activeCount = room.activeMembers.length || 1;
        const votesNeeded = Math.ceil(activeCount / 2);


        if (playback.skipVotes.length >= votesNeeded) {
            console.log(`✅ Vote threshold reached. Skipping...`);
            await executeSkip(req, res, room);
        } else {
            await room.save();
            res.status(200).json({
                message: "Vote registered.",
                skipped: false,
                votes: playback.skipVotes.length,
                needed: votesNeeded
            });
        }

    } catch (error) {
        console.error("Vote Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
})

playbackRouter.get("/messages", userAuth, async (req, res) => {
    try {

        const { code } = req.params;
        const { limit = 50, before } = req.query;

        const room = await Room.findOne({ code, isActive: true }).select('_id');
        if (!room) return res.status(404).json({ message: "Room not found." });

        const query = { room: room._id };

        if (before) {
            query._id = { $lt: before };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .limit(parseInt(limit))
            .populate('sender', 'username displayName profilePic');

        // Reverse so frontend receives [Oldest ... Newest] for correct chat display
        res.status(200).json(messages.reverse());

    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
})

playbackRouter.post('/messages', userAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const { content, type = 'text' } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Message content is required." });
        }

        // 1. Find Room
        const room = await Room.findOne({ code, isActive: true });
        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        // 2. Create Message
        const newMessage = new Message({
            room: room._id,
            sender: req.user._id,
            content,
            type
        });

        await newMessage.save();

        // 3. Populate Sender details for the response (so UI can show avatar immediately)
        await newMessage.populate('sender', 'username displayName profilePic');

        // emit socket event
        const io = req.app.get('io');
        io.to(room._id.toString()).emit('new_message', newMessage);

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

playbackRouter.delete('/queue/:songId', userAuth, async (req, res) => {
    try {
        const { code, songId } = req.params;

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        const songIndex = room.queue.findIndex(item => item._id.toString() === songId);
        if (songIndex === -1) {
            return res.status(404).json({ message: "Song not found in queue." });
        }

        const isHost = room.host.toString() === req.user._id.toString();
        const isOwner = room.queue[songIndex].addedBy.toString() === req.user._id.toString();

        if (!isHost && !isOwner) {
            return res.status(403).json({ message: "Unauthorized. You cannot remove this song." });
        }

        room.queue.splice(songIndex, 1);
        await room.save();

        res.status(200).json({
            message: "Song removed.",
            queue: room.queue
        });
    } catch (error) {
        console.error("Remove Queue Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
})

module.exports = playbackRouter;

async function executeSkip(req, res, room) {
    // 1. Logic to get next song
    const updatedRoom = await playNextSong(room._id);
    const io = req.app.get('io');
    const roomId = room._id.toString();

    // 2. Prepare Response Data
    let responseMessage = "Track skipped.";

    if (updatedRoom.currentPlayback && updatedRoom.currentPlayback.youtubeId) {
        // RESET ANCHOR POINT for new song
        const serverTime = Date.now();
        const nextTrack = updatedRoom.currentPlayback;

        // Manually update DB to ensure Sync State is correct
        await Room.findByIdAndUpdate(room._id, {
            'currentPlayback.isPlaying': true, // Auto-play next song
            'currentPlayback.lastUpdated': serverTime,
            'currentPlayback.position': 0,
            'currentPlayback.skipVotes': []
        });

        // 3. Emit Sync Event (Start Playing)
        io.to(roomId).emit('playback_sync', {
            action: 'play',
            youtubeId: nextTrack.youtubeId,
            seekTime: 0,
            serverTime, // T0 for clients
            name: nextTrack.name,
            artist: nextTrack.artist,
            image: nextTrack.image
        });
    } else {
        // Stop if queue empty
        io.to(roomId).emit('playback_sync', { action: 'stop' });
        responseMessage = "Skipped (Queue empty).";
    }

    // 4. Update Queue UI
    io.to(roomId).emit('queue_update', { queue: updatedRoom.queue });

    // 5. Send HTTP Response
    // We check !res.headersSent because in some edge cases executeSkip might be called twice
    if (!res.headersSent) {
        res.status(200).json({
            message: responseMessage,
            skipped: true,
            currentPlayback: updatedRoom.currentPlayback
        });
    }
}