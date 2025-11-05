const express = require("express");
const app = express();
const { connectDB } = require("./config/database")
const cookieParser = require("cookie-parser");
const { connectToRabbitMQ } = require('./services/messageQueueService');


//Import routes
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const socialRoutes = require('./routes/socialRoutes')
const musicRoutes = require("./routes/musicRoutes")


app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/users", socialRoutes);
app.use("/music", musicRoutes);


connectDB()
    .then(() => {
        console.log("✅ Database Connection established .....");
        app.listen(3000, () => {
            connectToRabbitMQ();
            console.log("Server is listening on port 3000 .....");
        });
    })
    .catch((err) => {
        console.log("❌ Database Connection error ....." + err.message);
    });

