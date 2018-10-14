const mongoose = require('mongoose')
const db = mongoose.connection;
const commonfunction = require('../commonFile/commonFunction')
const func = require('../fileHandler/function.js')
const Admin = mongoose.Schema({
    userName: {
        type: String,
        default:"Mobiloitte"
    },
    mobileNumber:{
    type:String,
    default:"8273242159"
    },
    address:{
     type:String
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    
    },
    lastLogin: {
        type: String,
        default:new Date()
    },
    token: {
        type: String
    },
    forgotOtp:{
        type:Number,
        default:1546456
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE","BLOCK"],
        default: "ACTIVE"
    }
})

const AdminModel = mongoose.model('admin', Admin, 'admin');
module.exports = AdminModel;

AdminModel.find({}, (err, result) => {
    if (err) {
        console.log("err====>>", err)
    }
    else if (result.length < 1) {
        func.bcrypt("12345678", (err, hash) => {
            new AdminModel({ email: "ph-anuj@mobiloitte.com", password: hash }).save((err, result) => {
                if (err) {
                    console.log("Error in saving user details.", err)
                }
                else {
                    console.log("Successfullly added admin details.")
                }
            })
        })
    }
})

