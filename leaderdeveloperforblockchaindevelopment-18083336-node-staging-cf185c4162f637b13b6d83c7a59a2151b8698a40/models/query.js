const mongoose = require('mongoose')
const db = mongoose.connection;


const Askquery = mongoose.Schema({
    name: {
        type: String,
        require:true
    },
    userEmail:{
        type:String,
        require: true,
        match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
    },
    walletAddress:{
        type:String,
        require:true
    },
    subject: {
        type: String,
        require:true
    },
    data: {
        type: String,
        require:true
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

module.exports = mongoose.model('askQuery', Askquery, 'askQuery');