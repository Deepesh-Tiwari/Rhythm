const roomHandler = require('./roomHandler');
const playbackHandler = require('./playbackHandler');
const chatHandler = require("./chatHandler")

const socketInit = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Socket Connected: ${socket.id}`);

        roomHandler(io, socket);
        playbackHandler(io, socket);
        chatHandler(io, socket);

        // Simple Test Event
        socket.on('ping', () => {
            console.log(`Ping received from ${socket.id}`);
            socket.emit('pong', { message: 'Hello from Socket Module!' });
        });

        // Global Disconnect Handler
        socket.on('disconnect', () => {
            console.log(`❌ Socket Disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketInit;