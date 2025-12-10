const socketInit = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Socket Connected: ${socket.id}`);

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