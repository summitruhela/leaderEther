const mongoose = require('mongoose')
const db = mongoose.connection;
const Schema=mongoose.Schema;
const User=require("./user");
const mongoosePaginate = require('mongoose-paginate');
const announce = mongoose.Schema({
    title: {
        type: String
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', "INACTIVE"],
        default: 'ACTIVE'
    },
    description: {
        type: String
    },
    icon:{
        type:String
    },
    user: [],
    //     {
    //     userId:{
    //         type:Schema.Types.ObjectId, ref:"user"
    //     },
    //     profilePic: String,
    //     userName: String,
    //     email: String,
    //     status:{type:String,
    //          enum:["ACTIVE","INACTIVE"],default:"ACTIVE"}

    // }],
    totalUser: {
        type: Number,
        default: 1
    },
    extraKey:{
        type:String,
        default:"null"
    },
    abc:{
        type: String,
        default:Date.now()
    }

}, 

{ timestamps: true })
announce.plugin(mongoosePaginate);
module.exports = mongoose.model('announce', announce, 'announce');
