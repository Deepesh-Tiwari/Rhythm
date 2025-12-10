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
            // Find which room this socket was in
            const room = await Room.findOne({ "activeMembers.socketId": socket.id });
            
            if (room) {
                console.log(`👋 Socket ${socket.id} left room ${room.code}`);
                
                // Remove user from activeMembers
                room.activeMembers = room.activeMembers.filter(m => m.socketId !== socket.id);
                await room.save();

                // Broadcast update
                io.to(room._id.toString()).emit('room_update', { 
                    type: 'MEMBERS_UPDATE', 
                    activeMembers: room.activeMembers 
                });
            }
        } catch (err) {
            console.error("Disconnect Error:", err);
        }
    });
};

module.exports = roomHandler;