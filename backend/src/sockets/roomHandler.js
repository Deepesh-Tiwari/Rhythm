const Room = require('../models/room');

const roomHandler = (io, socket) => {

    // JOIN ROOM
    socket.on('join_room', async ({ roomId, userId }) => {
        try {
            if (!roomId || !userId) return;

            socket.join(roomId); // Socket.io internal room join
            console.log(`👤 User ${userId} joined Room ${roomId}`);

            const room = await Room.findById(roomId);
            if (room) {
                // Check if user is already in activeMembers to avoid duplicates
                const exists = room.activeMembers.some(m => m.user.toString() === userId);

                if (!exists) {
                    room.activeMembers.push({
                        user: userId,
                        socketId: socket.id,
                        role: room.host.toString() === userId ? 'host' : 'listener',
                        joinedAt: new Date()
                    });
                    await room.save();
                } else {
                    // Update socketId for existing member (handle refresh)
                    const index = room.activeMembers.findIndex(m => m.user.toString() === userId);
                    room.activeMembers[index].socketId = socket.id;
                    await room.save();
                }

                // Broadcast full member list to update UI
                const updatedRoom = await Room.findById(roomId).populate('activeMembers.user', 'username displayName profilePic');
                io.to(roomId).emit('room_update', {
                    type: 'MEMBERS_UPDATE',
                    activeMembers: updatedRoom.activeMembers
                });
            }
        } catch (err) {
            console.error("Join Room Error:", err);
        }
    });

    // HANDLE DISCONNECT (Close Tab)
    socket.on('disconnect', async () => {
        try {
            // 1. Find the room where this socket was a member
            const room = await Room.findOne({ "activeMembers.socketId": socket.id });

            if (room) {
                // 2. Identify WHO is leaving (Get userId before removing them)
                const memberLeaving = room.activeMembers.find(m => m.socketId === socket.id);
                if (!memberLeaving) return;

                const userId = memberLeaving.user.toString(); // ✅ FIX: Extract ID here
                console.log(`👋 User ${userId} (Socket: ${socket.id}) leaving room ${room.code}`);

                // 3. Remove user from activeMembers
                room.activeMembers = room.activeMembers.filter(m => m.socketId !== socket.id);

                // 4. HOST MIGRATION LOGIC
                // Check if the person leaving was the Host
                if (room.host.toString() === userId) {

                    if (room.activeMembers.length > 0) {
                        // Promote the oldest remaining member
                        // Sort by joinedAt (Ascending) -> First one is oldest
                        const newHostMember = room.activeMembers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))[0];

                        room.host = newHostMember.user; // Assign new Host ID

                        // Update roles in the array
                        room.activeMembers = room.activeMembers.map(m => {
                            if (m.user.toString() === newHostMember.user.toString()) {
                                return { ...m, role: 'host' };
                            }
                            return m;
                        });

                        console.log(`👑 Host migrated to User ${newHostMember.user}`);
                    } else {
                        console.log("🌑 Room is now empty.");
                        room.isActive = false; // Mark inactive if empty
                        // Optional: Clear playback state
                        room.currentPlayback = { isPlaying: false, youtubeId: null };
                    }
                }

                await room.save();

                // 5. Broadcast update to remaining users
                // Populate users so frontend gets names/avatars
                const updatedRoom = await Room.findById(room._id).populate('activeMembers.user', 'username displayName profilePic');

                if (updatedRoom) {
                    io.to(room._id.toString()).emit('room_update', {
                        type: 'MEMBERS_UPDATE',
                        activeMembers: updatedRoom.activeMembers,
                        newHostId: room.host // Send new Host ID so frontend updates controls
                    });
                }
            }
        } catch (err) {
            console.error("Disconnect Error:", err);
        }
    });
};

module.exports = roomHandler;