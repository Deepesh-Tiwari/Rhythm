const express = require("express");
const mongoose = require("mongoose");
const {userAuth} = require("../middlewares/authMiddleware")
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");




const socialRouter = express.Router();

socialRouter.post("/requests", userAuth, async(req, res) => {

    try {

        const fromUserId = req.user._id;
        const { toUserId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(toUserId)) {
            return res.status(400).json({ message: "Invalid User ID format." });
        }

        const toUserExists = await User.findById(toUserId);

        if(!toUserExists){
            throw new Error("The user you are trying to connect with does not exist.")
        }

        if(fromUserId.equals(toUserId)){
            throw new Error("you can send request to yourself.")
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId : fromUserId, toUserId : toUserId},
                { fromUserId : toUserId, toUserId : fromUserId}
            ]
        });

        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                return res.status(409).json({ message: "You are already connected with this user." });
            }
            if (existingRequest.status === 'pending') {
                return res.status(409).json({ message: "A connection request to this user is already pending." });
            }
        }

        const newRequest = new ConnectionRequest({
            fromUserId : fromUserId,
            toUserId : toUserId,
            status : "pending"
        })

        await newRequest.save();

        res.status(201).json({
            message: "Connection request sent successfully.",
            request: newRequest
        })
        
    } catch (error) {
        console.error("Error sending connection request:", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }
})

module.exports = socialRouter;