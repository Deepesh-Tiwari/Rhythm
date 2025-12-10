const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios")
const { userAuth } = require("../middlewares/authMiddleware")
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const socialRouter = express.Router();

const SAFE_USER_DATA = "username displayName bio profilePic musicTaste";

socialRouter.post("/requests", userAuth, async (req, res) => {

    try {

        const fromUserId = req.user._id;
        const { toUserId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(toUserId)) {
            return res.status(400).json({ message: "Invalid User ID format." });
        }

        const toUserExists = await User.findById(toUserId);

        if (!toUserExists) {
            throw new Error("The user you are trying to connect with does not exist.")
        }

        if (fromUserId.equals(toUserId)) {
            throw new Error("you can send request to yourself.")
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId: fromUserId, toUserId: toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
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
            fromUserId: fromUserId,
            toUserId: toUserId,
            status: "pending"
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

socialRouter.patch("/requests/:requestId", userAuth, async (req, res) => {

    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const loggedInUserId = req.user._id;

        const validStatus = ["accepted", "rejected"];
        const isStatusValid = validStatus.includes(status);

        if (!isStatusValid) {
            return res.status(400).json({ message: "status not allowed" });
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid Request ID format." });
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUserId,
            status: "pending"
        })

        if (!connectionRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        connectionRequest.status = status;
        const updatedConnectionRequest = await connectionRequest.save();

        if (status == "accepted") {
            await User.findByIdAndUpdate(connectionRequest.fromUserId, { $inc: { friendsCount: 1 }, $push: { friends: connectionRequest.toUserId } });
            await User.findByIdAndUpdate(connectionRequest.toUserId, { $inc: { friendsCount: 1 }, $push: { friends: connectionRequest.fromUserId } });
        }

        res.status(200).json({ message: "Request updated sucessfully", connectionRequest: updatedConnectionRequest });

    } catch (error) {
        console.error("Error updating connection request status : ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }

})

socialRouter.get("/requests", userAuth, async (req, res) => {

    try {

        const loggedInUserId = req.user._id;

        const data = await ConnectionRequest.find({
            toUserId: loggedInUserId,
            status: "pending"
        }).populate("fromUserId", SAFE_USER_DATA);

        res.status(200).json({ message: "data fetched succesfully", data: data });

    } catch (error) {
        console.error("Error updating connection request status : ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }
})

socialRouter.get("/connections", userAuth, async (req, res) => {

    try {
        const loggedInUserId = req.user._id;

        const connectionData = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUserId, status: "accepted" },
                { toUserId: loggedInUserId, status: "accepted" }
            ]
        }).populate("fromUserId", SAFE_USER_DATA).populate("toUserId", SAFE_USER_DATA);

        console.log(connectionData);

        const friendsConnectionData = connectionData.map((connection) => {
            if (connection.fromUserId._id.equals(loggedInUserId)) {
                return connection.toUserId;
            }
            return connection.fromUserId;
        })

        res.status(200).json({ message: "data fetched sucessfully", data: friendsConnectionData });

    } catch (error) {
        console.error("Error getting connections: ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }

})

socialRouter.get("/recommendations", userAuth, async ( req, res) => {
    try {

        loggedInUserId = req.user._id;
        const limit = parseInt(req.query.limit, 10) || 20;

        const recommendationServiceUrl = `http://localhost:8000/recommend/${loggedInUserId}?limit=${limit * 2}`;

        let recommendedUserIds = [];

        try {
            const response = await axios.get(recommendationServiceUrl);
            recommendedUserIds = response.data.map(rec => rec.userId);
        } catch (error) {
            console.error("Could not connect to recommendation service:", error.message);
            return res.status(503).json({ message: "Recommendation service is temporarily unavailable." });
        }

        if(recommendedUserIds.length === 0){
            return res.status(200).json([]);
        }

        const currentUser = await User.findById(loggedInUserId).select('friends');
        const friendIds = new Set(currentUser.friends.map(friendId => friendId.toString()));

        // Get IDs of users with whom there is a pending or accepted request
        const existingRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId : loggedInUserId },
                { toUserId : loggedInUserId }
            ]
        }).select('fromUserId toUserId');

        const existingConnectionIds = new Set();
        existingRequests.forEach(req => {
            existingConnectionIds.add(req.fromUserId.toString());
            existingConnectionIds.add(req.toUserId.toString());
        });

        const finalUserIdsToFetch = recommendedUserIds.filter(id => 
            id !== loggedInUserId.toString() && // Don't recommend the user to themselves
            !friendIds.has(id) &&
            !existingConnectionIds.has(id)
        );

        if (finalUserIdsToFetch.length === 0) {
            return res.status(200).json([]);
        }

        const recommendedUsers = await User.find({
            '_id': { $in: finalUserIdsToFetch }
        }).select('username displayName profilePic');

        const userMap = new Map(recommendedUsers.map(user => [user._id.toString(), user]));
        const sortedRecommendedUsers = finalUserIdsToFetch
            .map(id => userMap.get(id))
            .filter(user => user);

        res.status(200).json(sortedRecommendedUsers.slice(0, limit));

        
    } catch (error) {
        console.error("Error getting connections: ", error);
        res.status(500).json({ message: "An internal server error occurred: " + error.message });
    }

})

module.exports = socialRouter;