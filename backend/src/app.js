const express = require("express");
const cors = require('cors');
const http = require("http");
const { connectDB } = require("./config/database")
const cookieParser = require("cookie-parser");
const { connectToRabbitMQ } = require('./services/messageQueueService');
const { Server } = require("socket.io");
const socketInit = require('./sockets/index');


//Import routes
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const socialRoutes = require('./routes/socialRoutes')
const musicRoutes = require("./routes/musicRoutes")
const roomRoutes = require("./routes/roomRoutes");
const playbackRoutes = require("./routes/playbackRoutes");


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173'], // Match your frontend ports
        credentials: true,
        methods: ["GET", "POST"]
    }
});

socketInit(io);


app.use(cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],// Use your Vite dev server's port
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
// app.use("/users", socialRoutes);
app.use("/music", musicRoutes);
app.use("/rooms", roomRoutes);
app.use("/rooms/:code", playbackRoutes);


connectDB()
    .then(() => {
        console.log("✅ Database Connection established .....");
        server.listen(3000, '127.0.0.1', () => {
            connectToRabbitMQ();
            console.log("✅ Server (Express + Socket.io) is listening on port 3000 .....");
        });
    })
    .catch((err) => {
        console.log("❌ Database Connection error ....." + err.message);
    });

