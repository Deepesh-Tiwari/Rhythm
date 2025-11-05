const validator = require("validator");

const validateSignUp = (req) => {

    const {email, password, username} = req.body;

    if(!validator.isEmail(email)){
        throw new Error("Email id not valid");
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Give me a Strong Password");
    }
}

module.exports = {validateSignUp};