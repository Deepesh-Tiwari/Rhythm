const express = require('express');
const { userAuth } = require('../middlewares/authMiddleware')
const { updateUserSchema } = require('../validation/userValidator')
const userRouter = express.Router();

userRouter.get('/me', userAuth, async (req, res) => {

    try {
        const user = req.user;
        res.status(200).json({ message: "response sucessfull", user });
    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }
})

userRouter.patch('/me' , userAuth, async(req, res) => {

    try {
        const {error, value} = updateUserSchema.validate(req.body, {abortEarly : false});
        if(error){
            const messages = error.details.map(err => err.message).join(', ');
            throw new Error(messages);
        }

        const allowedUpdates = Object.keys(value);
        const user = req.user;

        allowedUpdates.forEach( field => {
            user[field] = value[field];
        })

        await user.save();

        res.status(200).json({ message: "Profile updated successfully", user });
        
    } catch (error) {
        res.status(400).send("Some Problem with server : " + error.message);
    }

})



module.exports = userRouter;