const express = require('express');
const { userAuth } = require("../middlewares/authMiddleware");
const Room = require('../models/room');
const Message = require('../models/message');
const { addSongToQueue, playNextSong} = require('../services/roomService');



const playbackRouter = express.Router({ mergeParams: true });

playbackRouter.post("/queue", userAuth , async(req, res) => {
    try {
        const { code } = req.params;

        const { spotifyTrack } = req.body;

        if (!spotifyTrack || !spotifyTrack.id) {
            return res.status(400).json({ message: "Invalid track data. 'id' is required." });
        }

        const room = await Room.findOne({ code, isActive: true });

        if(!room){
            return res.status(404).json({message : "Room not found or inactive."});
        }

        const updatedRoom = await addSongToQueue(
            room._id,
            spotifyTrack,
            req.user._id
        );

        res.status(200).json({
            message: "Song added to queue",
            queue: updatedRoom.queue
        });


    } catch (error) {
        console.error("Add to Queue Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
})

playbackRouter.post("/vote",userAuth, async(req , res) => {
    try {
        const { code } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        if (!room.currentPlayback || !room.currentPlayback.isPlaying) {
            return res.status(400).json({ message: "Nothing is playing to vote on." });
        }

        const alreadyVoted = room.currentPlayback.skipVotes.includes(userId);
        if (alreadyVoted) {
            return res.status(400).json({ message: "You have already voted." });
        }

        room.currentPlayback.skipVotes.push(userId);
        
        const activeCount = room.activeMembers.length || 1;
        const votesNeeded = Math.ceil(activeCount / 2);
        const currentVotes = room.currentPlayback.skipVotes.length;

        let message = "Vote registered.";
        let skipped = false;

        if (currentVotes >= votesNeeded) {
            await playNextSong(room._id);
            message = "Vote threshold reached. Skipping track.";
            skipped = true;
        } else {
            await room.save(); // Just save the vote
        }

        // (Future: Emit socket event 'vote_update' or 'playback_sync' here)

        res.status(200).json({
            message,
            skipped,
            votes: currentVotes,
            needed: votesNeeded,
            currentPlayback: room.currentPlayback
        });

    } catch (error) {
        console.error("Vote Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
})

playbackRouter.get("/messages", userAuth, async( req, res) => {
    try {

        const {code} = req.params;
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

        // (Future: Emit socket 'new_message' here)

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