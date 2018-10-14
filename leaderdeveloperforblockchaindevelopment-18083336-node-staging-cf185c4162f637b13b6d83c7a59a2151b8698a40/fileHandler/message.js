const mongoose = require('mongoose')
let admin = require('../models/admin.js')
let nodemailer = require('nodemailer')
var jwt = require('jsonwebtoken');
var config = require("../config/config")
let func = require('../fileHandler/function.js');
module.exports = {

    getCode: () => {
        var idLength=9;
        var chars="0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z";
        chars=chars.split(",");
        var min=0;
        var max=chars.length-1;
        var id="";
        for(var i=0; i<idLength;i++)
        {
        id+=chars[ Math.floor(Math.random()*(max - min + 1) + min) ];
        }
        return id;
        },


       sendEmail : (email, subject, message, link, cc, bcc, callback) => {
            console.log("in send email for forgot password ==> ", email, subject, message, link)
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ph-anuj@mobiloitte.com',
                    pass: 'anuj11083'
                }
            })
            // console.log(message,"\n",link)
            let messageObj = {
                from: 'Noreply<ph-anuj@mobiloitte.com>',
                to: email,
                subject: subject,
                text: message, //"A sentence just to check the nodemailer",
                html: "your forgot password is----->"+link,
                cc: cc,
                bcc: bcc
            }
            transporter.sendMail(messageObj, (err, info) => {
                console.log("in send mail second console-----", err, info)
                if (err) {
                    console.log("Error occured", err)
                    callback(null);
                } else {
                    console.log("Mail sent")
                    callback(null, info)
                }
            })
        },
        



}
