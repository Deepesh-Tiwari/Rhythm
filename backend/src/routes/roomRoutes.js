const express = require("express");
const { userAuth } = require("../middlewares/authMiddleware");
const { createRoom } = require("../services/roomService")
const Room = require("../models/room");
const { handleUserLeaveRoom } = require("../services/roomService");

const roomRouter = express.Router();


roomRouter.post("/", userAuth, async (req, res) => {

    try {

        const hostUserId = req.user._id;

        const activeRoomCount = await Room.countDocuments({ host: hostUserId, isActive: true });

        if (activeRoomCount >= 5) {
            return res.status(400).json({
                message: "You have reached the limit of 5 active rooms. Please close a room to create a new one."
            });
        }

        const { name, description, isPublic, genres } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Room name is required." });
        }

        const newRoom = await createRoom(name, description, isPublic, hostUserId, genres);

        res.status(201).json({
            message: "Room created successfully",
            room: newRoom
        });

    } catch (error) {
        console.error("Create Room Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

roomRouter.get('/', userAuth, async (req, res) => {
    try {
        // Pagination logic (Defaults: Page 1, 10 rooms per page)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Query DB
        // Find rooms that are Public AND Active
        const rooms = await Room.find({ isPublic: true, isActive: true })
            .sort({ createdAt: -1 }) // Newest first (or sort by 'activeMembers.length' for popularity)
            .skip(skip)
            .limit(limit)
            .populate('host', 'username displayName profilePic') // Only get necessary host info
            .select('name code description genres activeMembers currentPlayback'); // Exclude heavy 'queue' and 'messages'

        // 2. Transform Data (Optimization)
        // Instead of sending the full array of members, just send the count
        const roomFeed = rooms.map(room => ({
            _id: room._id,
            code: room.code,
            name: room.name,
            description: room.description,
            host: room.host,
            genres: room.genres,
            activeMemberCount: room.activeMembers.length, // Just the number
            currentTrack: room.currentPlayback?.name
                ? {
                    name: room.currentPlayback.name,
                    artist: room.currentPlayback.artist,
                    image: room.currentPlayback.image
                }
                : null
        }));

        res.status(200).json({
            message: "Rooms fetched successfully",
            rooms: roomFeed,
            page,
            hasMore: rooms.length === limit
        });

    } catch (error) {
        console.error("Fetch Rooms Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

roomRouter.get('/:code', userAuth, async (req, res) => {
    try {

        const { code } = req.params;

        const room = await Room.findOne({
            code: code,
            isActive: true
        }).populate('host', 'username displayName profilePic')
            .populate({
                path: 'activeMembers.user',
                select: 'username displayName profilePic'
            })
            .populate({
                path: 'queue.addedBy',
                select: 'username'
            });

        if (!room) {
            return res.status(404).json({ message: "Room not found or has ended." });
        }

        res.status(200).json({
            message: "Room fetched successfully",
            room,
        });

    } catch (error) {
        console.error("Fetch Get room by code Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
})

roomRouter.put("/:code", userAuth, async (req, res) => {

    try {
        const { code } = req.params;
        const { name, description, isPublic, genres } = req.body;

        const room = await Room.findOne({
            code: code,
            isActive: true
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized. Only the host can update room settings." });
        }

        if (name) room.name = name;
        if (description !== undefined) room.description = description;
        if (isPublic !== undefined) room.isPublic = isPublic;
        if (genres) room.genres = genres;

        await room.save();

        res.status(200).json({
            message: "Room updated successfully",
            room
        });

    } catch (error) {
        console.error("Change room settings Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
})

roomRouter.delete("/:code", userAuth, async (req, res) => {
    try {
        const { code } = req.params;

        const room = await Room.findOne({ code, isActive: true });

        if (!room) {
            return res.status(404).json({ message: "Room not found or already closed." });
        }

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized. Only the host can close the room." });
        }

        room.isActive = false;
        room.activeMembers = [];

        await room.save();
        res.status(200).json({ message: "Room closed successfully." });

    } catch (error) {
        console.error("Error deleting room ", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
})

roomRouter.get("/:code/members", userAuth, async ( req, res) => {

    try {

        const {code} = req.params;
        
        const room = await Room.findOne({ code, isActive: true }).select('activeMembers').populate('activeMembers.user','username displayName profilePic');

        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        const members = room.activeMembers.map(m => ({
            userId: m.user._id,
            username: m.user.username,
            displayName: m.user.displayName,
            profilePic: m.user.profilePic,
            role: m.role,
            joinedAt: m.joinedAt
        }));

        res.status(200).json({ message : "data fetched sucessfully", count: members.length, members });
        
    } catch (error) {
        console.error("Error getting members", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
})

roomRouter.patch("/:code/role", userAuth, async(req, res) => {

    try {

        const {code} = req.params;
        const {targetUserId, newRole} = req.body;

        if(!["moderator", "listener"].includes(newRole)){
            return res.status(400).json({ message: "Invalid role. Use 'moderator' or 'listener'." });
        }

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized. Only the Host can promote/demote users." });
        }

        const memberIndex = room.activeMembers.findIndex(
            m => m.user.toString() === targetUserId
        );

        if (memberIndex === -1) {
            return res.status(404).json({ message: "User is not currently in the room." });
        }

        room.activeMembers[memberIndex].role = newRole;
        await room.save();

        // (Future: Emit socket event 'role_update' so the user sees their new permissions instantly)

        res.status(200).json({ 
            message: `User promoted to ${newRole}`, 
            member: room.activeMembers[memberIndex] 
        });
        
    } catch (error) {
        console.error("Role Change Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
})

roomRouter.post("/:code/leave", userAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ code, isActive: true });
        
        if (!room) {
            // Even if room is closed, we just say success to let frontend redirect
            return res.status(200).json({ message: "Left room." });
        }

        const io = req.app.get('io');
        
        // ✅ Reuse the logic
        await handleUserLeaveRoom(room._id, userId, io);

        res.status(200).json({ message: "Successfully left the room." });

    } catch (error) {
        console.error("Leave Room Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
});

roomRouter.delete('/:code/members/:userId', userAuth, async (req, res) => {
    try {
        const { code, userId: targetUserId } = req.params;
        const requesterId = req.user._id.toString();

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        // 1. Determine Requester's Role
        const isHost = room.host.toString() === requesterId;
        const requesterMember = room.activeMembers.find(m => m.user.toString() === requesterId);
        const isMod = requesterMember && requesterMember.role === 'moderator';

        if (!isHost && !isMod) {
            return res.status(403).json({ message: "Unauthorized. You do not have permission to kick users." });
        }

        // 2. Protect the Host (Host cannot be kicked)
        if (room.host.toString() === targetUserId) {
            return res.status(400).json({ message: "You cannot kick the Host." });
        }

        // 3. Remove User
        const initialLength = room.activeMembers.length;
        room.activeMembers = room.activeMembers.filter(
            m => m.user.toString() !== targetUserId
        );

        if (room.activeMembers.length === initialLength) {
            return res.status(404).json({ message: "User not found in room." });
        }

        await room.save();

        // (Future: Emit 'user_kicked' socket event to force their browser to disconnect)

        res.status(200).json({ message: "User kicked successfully." });

    } catch (error) {
        console.error("Kick User Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

roomRouter.post('/:code/invite', userAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const { targetUserId } = req.body || {}; // Optional: If you want to ping a specific friend

        const room = await Room.findOne({ code, isActive: true });
        if (!room) return res.status(404).json({ message: "Room not found." });

        const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const inviteLink = `${baseUrl}/room/${code}`;

        // 2. (Optional) Handle Direct Invite
        // If targetUserId is sent, we would create a Notification in the DB here.
        // For now, we will just acknowledge it.
        let status = "Link generated";
        if (targetUserId) {
            // TODO: Add logic to push to User.notifications array
            status = "Invite sent (Mock)";
        }

        res.status(200).json({
            message: "Invite generated",
            link: inviteLink,
            code: code,
            status
        });

    } catch (error) {
        console.error("Invite Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


module.exports = roomRouter;