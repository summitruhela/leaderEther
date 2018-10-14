const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commisionSchema = new Schema({
    commision: {
        type: Number
    },
    tokenName:{
        type:String
    },
    tokenId:{
        type:String
    }
},{
    timestamps: true
});

module.exports = mongoose.model("Commision",commisionSchema);