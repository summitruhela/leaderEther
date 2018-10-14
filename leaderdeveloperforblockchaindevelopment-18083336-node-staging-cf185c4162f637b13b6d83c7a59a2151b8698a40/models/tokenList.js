const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const db = mongoose.connection;

const tokenList = mongoose.Schema({
    tokenName: {
        type: String
    },
    tokenAddress:{
        type:String,
       },
    tokenDecimal:{
        type:String
    },
    tokenSymbol:{
        type:String
    },
    status:{
        type:String,
        enum:["REQUEST","REJECT","ACCEPT", "ACTIVE","DEACTIVE" ,"BLOCK"]
    },
    createdBy:{
        type:String
    },
    addedBy:{
        type:String,
        enum:["USER","ADMIN"]
    },
    abi:"",
    action:{
        type:String,
        enum:["ACTIVE","INACTIVE"]
    },
    isAdmin:{
        type:String
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
tokenList.plugin(mongoosePaginate)
module.exports = mongoose.model('tokenList', tokenList, 'tokenList');