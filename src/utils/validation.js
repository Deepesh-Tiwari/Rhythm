const validator = require("validator");

const validateSignUp = (req) => {

    const {emailId, password, username} = req.body;

    if(!validator.isEmail(emailId)){
        throw new Error("Email id not valid");
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Give me a Strong Password");
    }
}

module.exports = {validateSignUp};