const jwt = require("jsonwebtoken");
const User  = require('../models/user');
const { validateSignUp } = require('../utils/validation')

const userAuth = async(req, res, next) => {
    
    try {
        
        const token = req.cookies.token;
        if(!token){
            throw new Error("Token not valid");
        }

        const decodedData = jwt.verify(token, "shhhhhh");
        const {_id} = decodedData;

        const user = await User.findById(_id);
        
        if(!user){
            throw new Error("Token not valid");
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).send("some problem with server " + error.message);
    }

}

module.exports = { userAuth };