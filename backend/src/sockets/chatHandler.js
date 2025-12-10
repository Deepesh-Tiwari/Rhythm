const Message = require('../models/message');

const chatHandler = (io, socket) => {

    socket.on('send_message', async ({ roomId, content, userId }) => {
        try {
            // Save to DB
            const newMessage = new Message({
                room: roomId,
                sender: userId,
                content,
                type: 'text'
            });
            await newMessage.save();
            
            // Populate sender info for UI
            await newMessage.populate('sender', 'username displayName profilePic');

            // Broadcast to room immediately
            io.to(roomId).emit('new_message', newMessage);

        } catch (err) {
            console.error("Chat Socket Error:", err);
        }
    });
};

module.exports = chatHandler;