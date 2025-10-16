const mongoose = require("mongoose");
const {Schema, model} = mongoose;
const validator = require("validator");


const userSchema = new Schema({
    userName : {
        type: String,
        maxlength : 20,
        minlength : 4,
    },
    emailId : {
        type: String,
        required: true,
        lowercase : true,
        unique: true,
        trim: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email Address");
            }
        }
    },
    hashedPassword : {
        type: String,
        required: true,
    },
    displayName : {
        type: String,
    },
    bio : {
        type: String,
        default: "No Bio Provided",
    },
    photoURL : {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSySSYZ8Vr_66g-cqvEwxmn8qA2KRRTrbcAPA&s"
    },
    age : {
        type: Number,
        min: 18
    },
    gender : {
        type : String,
        validate(value) {
            if(!["male", "female", "others"].includes(value)){
                throw new Error("Gender not valid");
            }
        }
    },
    skills : [],
    },
    {
        timestamps: true
    }
)

const User = model('User', userSchema);
module.exports = {User};