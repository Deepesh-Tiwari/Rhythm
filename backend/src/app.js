require('dotenv').config()

const express = require("express");
const cors = require('cors');
const http = require("http");
const { connectDB } = require("./config/database")
const cookieParser = require("cookie-parser");
const { connectToRabbitMQ } = require('./services/messageQueueService');
const { Server } = require("socket.io");
const socketInit = require('./sockets/index');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


//Import routes
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const socialRoutes = require('./routes/socialRoutes')
const musicRoutes = require("./routes/musicRoutes")
const roomRoutes = require("./routes/roomRoutes");
const playbackRoutes = require("./routes/playbackRoutes");

const { cleanupCache } = require("./services/cleanupService");


const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://127.0.0.1:5173";

// CORS Configuration
// Allow both the specific client URL and localhost for easier dev testing
const allowedOrigins = [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"];

const io = new Server(server, {
    cors: {
        origin : allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    }
});
app.set('io', io);
socketInit(io);


app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 150, 
    standardHeaders: true, 
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again later." }
});
app.use('/auth', limiter); // Apply strict limit to Auth
app.use('/users', limiter);


app.use(cors({
    origin: allowedOrigins,
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

cleanupCache();

connectDB()
    .then(() => {
        console.log("✅ Database Connection established .....");
        server.listen(PORT, '127.0.0.1', () => {
            connectToRabbitMQ();
            console.log("✅ Server (Express + Socket.io) is listening on port 3000 .....");
        });
    })
    .catch((err) => {
        console.log("❌ Database Connection error ....." + err.message);
    });

