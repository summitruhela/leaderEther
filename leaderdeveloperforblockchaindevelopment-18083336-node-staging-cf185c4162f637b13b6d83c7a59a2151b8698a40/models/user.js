const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const db = mongoose.connection;
let User = mongoose.Schema({
    email: {
        type: String,
        require: true,
        // match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
    },
    userName: {
        type: String,
        require: true
    },
    mobileNumber: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    passphrase: {
        type: String,
        unique: true
    },
    privateKey: {
        type: String,
        unique: true
    },
    signInHistoryArray:[{
        deviceId:String,
        signInTime:String,
        signOutTime:String,
        location:String,
        status:{
            type:String,
        default:"signIn",
    enum:["signIn","signOut"]},
    deviceStatus:{
        type:String,
        default:"ACTIVE",
        enum:["ACTIVE","DEACTIVE"]
    }  
    }],
    blockedDevices:{
        type:Array        
    },
    currency:{
        type:String,
        enum:["USD","EUR","JPY","CNY","KRW"],
        default:"USD"
    },
    emailOtp: {
        type: Number
    },
    deviceId: {
        type: Array
    },
    fingerPrint: {
        type: String,
        enum: ["ON", "OFF"],
        default: "OFF"
    },
    fingerPrintUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ["ACTIVE", "DEACTIVE","BLOCK"],
        default: "DEACTIVE"
    },

    location:{
    type:String,
    default:"DELHI"

    },

    walletAddress: {
        type: String,
        unique: true
    },

    mobileOtp: {
        type: Number
    },
 
    faceDetection: {
        type: String,
        enum: ["ON", "OFF"],
        default: "OFF"
    },
    faceDetectionUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    createdAt1: {
        type: String,
        default: Date.now()
    }
})


User.plugin(mongoosePaginate)
User.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('user', User, 'user');