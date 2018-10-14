const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');


const termsPrivacySchema = new Schema({
    termsOfUse: {
        type: String
    },

    faq: [{
        Ques:String,
        Ans:String,
        status:{type:String,enum:["ACTIVE","INACTIVE"],default:"ACTIVE"}
    }],

},{
    timestamps: true
});

termsPrivacySchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Static",termsPrivacySchema);

mongoose.model('Static',termsPrivacySchema).find((error,result)=>{
    if(result.length==0)
    {
        let obj = {
            termsOfUse: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            faq:{Ques:"This Is ss RAndom Question",Ans:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."},
        };
        mongoose.model('Static',termsPrivacySchema).create(obj,(error,success)=>{
            if(error)
                console.log("Error is"+ error)
            else
                console.log("Static content saved succesfully.",success);
        })
    }
})