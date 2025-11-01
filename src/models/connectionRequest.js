const { required } = require('joi');
const mongoose = require('mongoose');
const { Schema, model } = mongoose;


const connectionRequestSchema = new Schema({

    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        index : true,
        required: true,
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        index : true,
        required: true
    },
    status: {
        type: String,
        required: true,
        index : true,
        enum: {
            values: ["pending", "accepted", "rejected"],
            message: `{VALUE} is incorrect status type`
        }
    },
    },
    { timestamps: true }
)

connectionRequestSchema.index({fromUserId : 1, toUserId : 1})

connectionRequestSchema.pre("save", function(next){
    const connectionRequest = this;
    // check is from User is same as toUser
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error("Cannot send connection request to to yourself!");
    }

    next();
});

module.exports = model('ConnectionRequest', connectionRequestSchema);