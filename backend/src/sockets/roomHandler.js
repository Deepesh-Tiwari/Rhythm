const Room = require('../models/room');
const { handleUserLeaveRoom } = require("../services/roomService");

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
            // 1. Find room by socket ID
            const room = await Room.findOne({ "activeMembers.socketId": socket.id });
            
            if (room) {
                const member = room.activeMembers.find(m => m.socketId === socket.id);
                if (!member) return;

                const userId = member.user.toString();
                
                console.log(`⚠️ User ${userId} disconnected. Waiting 5s before removal...`);

                // 2. SET TIMEOUT (The Grace Period)
                // We wait 5 seconds. If they don't rejoin by then, we remove them.
                const timer = setTimeout(async () => {
                    // console.log(`❌ Grace period over. Removing User ${userId}.`);
                    
                    await handleUserLeaveRoom(room._id, userId, io);
                    
                    disconnectTimers.delete(userId);
                }, 5000); // 5 Seconds wait time

                // Save timer so 'join_room' can cancel it
                disconnectTimers.set(userId, timer);
            }
        } catch (err) {
            console.error("Disconnect Error:", err);
        }
    });
};

module.exports = roomHandler;