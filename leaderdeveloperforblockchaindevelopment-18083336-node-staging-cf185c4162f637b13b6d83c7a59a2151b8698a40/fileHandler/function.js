const mongoose = require('mongoose')
let admin = require('../models/admin.js')
let config = require('../config/config.js')
let nodemailer = require('nodemailer')
var CryptoJS = require("crypto-js");
var bcrypt = require('bcryptjs');
let saltRounds = 10;
let myPlaintextPassword = 's0/\/\P4$$w0rD'
let jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary')
// create a passphrase random
var passphrase = require('passphrase');
//  twilio credentials ............................dubeyanuj639@gmail.com 
const accountSid = 'AC2f70a2338e2e98c22238204f8e8e2f46';
const authToken = '1dcfc1b53628ef167d1f92098a317998';
const client = require('twilio')(accountSid, authToken);
//  nexmo credentials ............................dubeyanuj639@gmail.com 
const Nexmo = require('nexmo')
const nexmo = new Nexmo({
    apiKey: '1ae2c8a3',
    apiSecret: '9hvObNUEuZkpQDeH'
});
// Cloudinary credentials .................................................
cloudinary.config({
    cloud_name: config.cloud.cloud_name,
    api_key: config.cloud.api_key,
    api_secret: config.cloud.api_secret
});
// to hit any url (third party).............................................
var Client = require('node-rest-client').Client;
var nodeClient = new Client();
// using for transfer ether ................................................
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f');
let Tx = require('ethereumjs-tx');
var Accounts = require('web3-eth-accounts');
var accounts = new Accounts('https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f');
const numberToBN = require('number-to-bn');

exports.responseHandler = (res, responseCode, responseMessage, data) => {
        res.send({
            responseCode: responseCode,
            responseMessage: responseMessage,
            data: data
        })
    },

    exports.imageUploadToCloudinary = (imageB64, callback) => {
        console.log(imageB64)
        cloudinary.v2.uploader.upload(imageB64, (err, result) => {
            console.log("===>>>>in cloudinary function =====>>>", err, result);
            callback(result.url);
        })
    },

    /*  encrypt the private key ................... */
    exports.crypt = function (divPass, cb) {
        // console.log("calling function divPass====", divPass)
        var ciphertext = CryptoJS.AES.encrypt(divPass, 'MobiloitteAnujdubey').toString();
        // console.log("cipher text ====>>>",ciphertext)
        cb(null, ciphertext)
    };
/*  decrypt the private key ................... */
exports.cryptVerify = function (divPass, cb) {
    var bytes = CryptoJS.AES.decrypt(divPass, 'MobiloitteAnujdubey');
    // console.log("cipher text decrypt in bytes========>>>>",bytes)
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    // console.log("cipher text decrypt originalText========>>>>",originalText)
    cb(null, originalText)
};

   /* bcrypt the password ........................................................................ */
exports.bcrypt = function (divPass, cb) {
    // console.log("calling bcrypt funciton ====")
    bcrypt.genSalt(saltRounds, function (err, salt) {
        // console.log("calling bcrypt funciton 2 ====")
        bcrypt.hash(divPass, salt, function (err, hashPassword) {
            //   console.log("errrr   hash  ==>>",err,hashPassword)
            cb(null, hashPassword)
            // return hashPassword;
        });
    });


};

exports.bcryptVerify = (password, dbPassword, cb) => {
    console.log("=======in bcypt verify", password, dbPassword)
    bcrypt.compare(password, dbPassword, (err, res) => {
        if (err) {
            return commonFile.responseHandler(res, 400, "Invalid Credentials.")
        } else {
            console.log("null , response======== verify  password by bcrypt function =====>>>>", null, res)
            cb(null, res)
        }
    });
}


exports.jwt = (body, cb) => {
    console.log("calling jwt function ====", body)
    let token = jwt.sign(body, config.jwtSecretKey)
    console.log("token====", token)
    cb(null, token)
};

exports.jwtVerify = (req, res, next) => {
    console.log("req.headers========", req.headers)
    if (req.headers.jwt == "null" || req.headers.jwt == "" || req.headers.jwt == "undefined" || req.headers.jwt == null || req.headers.jwt == undefined) {
        console.log("token missing")
        return res.send({
            responseCode: 500,
            responseMessage: "Token Missing."
        })
    }

    jwt.verify(req.headers.jwt, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            console.log("Invalid token")
            return res.send({
                responseCode: 500,
                responseMessage: "Token Invalid."
            })
        } else {
            console.log("decode=====>>>>", decoded)
            next();
        }
    });


}


/*  Allow less secure apps: ON  from your gmail for sending gmail*/

exports.sendEmail = (email, subject, message, link, cc, bcc, callback) => {
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
        html: link, //"Click on this link to <a href=" + link + ">reset Password</a>",
        cc: cc,
        bcc: bcc
    }
    transporter.sendMail(messageObj, (err, info) => {
        // console.log("in send mail second console-----", err, info)
        if (err) {
            // console.log("Error occured", err)
            callback(null);
        } else {
            // console.log("Mail sent")
            callback(null, info)
        }
    })
}

exports.balanceCal = async (contract, ownerAddress) => {
    // console.log("in balance cal function========",contract,ownerAddress)
    try {
        // console.log("====in try block====")
        var balance = await contract.methods.balanceOf(ownerAddress).call();
        // console.log("in try block ====>>", balance);
        return balance;
    } catch (err) {
        // console.log("====in catch block====", err)
        // throw err;
        return err;
    }
}

//  twilio for sending otp on mobiles.......................................................................... 
exports.sendMessage = (number, text, callback) => {
    client.messages.create({
        body: 'Your otp-  ' + "123642dfherw5",
        to: '+917451919823', // Text this number
        from: '+15868008694' // From a valid Twilio number
    }).then(data => {
        console.log("your otp is====>>", data)
        callback(null, data)
    }).catch(err => {
        console.log("in catch send otp to mobile by twilio===")
        callback(err)
    })
}

//  nexmo for sending otp on mobiles.......................................................................... 
exports.sendMessageNexmo = (number, otp, callback) => {
    // callback(null, otp)
    // return;
    // let otp = Math.floor(100000 + Math.random() * 900000) //six digit random number
    let from = '+918273242159';
    let to = '+91' + number;
    let text = 'Your OTP verification number is ' + otp;
    nexmo.message.sendSms(from, to, text, (error, response) => {
        if (error) {
            console.log("second")
            throw error;
        } else {
            console.log("response=====>>", response)
            callback(null, otp)
        }
    })
}
// create the passphrase........................................................................................
exports.createPass = (cb) => {
    var entropy = 175; //create 12 words passphrase
    passphrase(entropy, (_, phrase, actualEntropy) => {
        console.log('My passphrase is:', phrase);
        cb(null, phrase);
    });
}

// get the response from third party or etherscan................................................................
exports.nodeClient = (url, cb) => {
    /* to get all transaction from a account 
     var url = "http://api-ropsten.etherscan.io/api?module=account&action=txlist&address=" + address + "&sort=dsc"
     */
    // console.log("url ton hit===>>", url)
    nodeClient.get(url, (data, response) => {
        //   console.log("data==>>", data);
        cb(null, data)
        //   console.log("response===>",response);
    });
}



exports.sendHtmlEmail = (email, subject, message, link, cc, bcc, name, callback) => {
    var userName = name
    var html = `<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="">
      <meta name="author" content="">
      <title>Vendor & Users</title>
    </head>
    <body style="margin: 0px; padding: 0px; background-color: #eeeeee;">
   
      <div style="width:600px; margin:20px auto; background:#fff; font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300;color:#777;line-height:30px">
   
        <table style="width: 100%; border: 1px solid #ccc;" cellpadding="0" cellspacing="0">
          <tbody>
              <tr style="background-color: #e7e7e7;">
                <td style="padding: 15px;">
                  <a href="#"><img src="{{$img}}" style="width:200px;"></a>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 15px 10px;">Dear ` + userName + `</td>
              </tr>
              <tr>
              <td style="padding: 10px 15px 10px;">Thank for you registering. </td>
            </tr>
              <tr>
                <td style="padding: 10px 15px 10px;">Please input this code on Anzen app to verify your email address & finish your account registration.</td>
              </tr>
              <br>
              <tr>
              <td style=""><p align="center"><button id="btn" style="color: #fff;background-color: #2ba12b;font-size: 27px;width: 145px;padding: 4px;border-radius: 10px;">` + link + `</button></p></td></td>
              </tr>
              <br>
              <tr>
              <td style="padding: 10px 15px 10px;">After your successful account registration, you can use our services & we look forward to serve you :) </td>
            </tr>
                     
              <tr>
                <td style="padding: 25px 15px 20px;">
                  Thanks &amp; Regards <br>  Anzen Wallet
                </td>
              </tr>
              <tr>
                  <td style="text-align: center; padding: 20px; background-color: #4e555a; color: #eeeeee;">copyright @ Anzen Wallet </td>
              </tr>
          </tbody>
        </table>
        <p align="center"><button id="btn">dghbdhj</button></p>
      </div>
    </body>
   </html>`

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
        html: html, //"Click on this link to <a href=" + link + ">reset Password</a>",
        cc: cc,
        bcc: bcc
    }
    transporter.sendMail(messageObj, (err, info) => {
        // console.log("in send mail second console-----", err, info)
        if (err) {
            // console.log("Error occured", err)
            callback(null);
        } else {
            // console.log("Mail sent")
            callback(null, info)
        }
    })
}

exports.sendHtmlEmailForPassword = (email, subject, message, link, cc, bcc, name, callback) => {
    var userName = name
    var html = `<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="">
      <meta name="author" content="">
      <title>Vendor & Users</title>
    </head>
    <body style="margin: 0px; padding: 0px; background-color: #eeeeee;">
   
      <div style="width:600px; margin:20px auto; background:#fff; font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300;color:#777;line-height:30px">
   
        <table style="width: 100%; border: 1px solid #ccc;" cellpadding="0" cellspacing="0">
          <tbody>
              <tr style="background-color: #e7e7e7;">
                <td style="padding: 15px;">
                  <a href="#"><img src="{{$img}}" style="width:200px;"></a>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 15px 10px;">Dear ` + userName + `</td>
              </tr>
              <tr>
                <td style="padding: 10px 15px 10px;">Please input this code on Anzen app to verify your email address for reset your Email.</td>
              </tr>
              <br>
              <tr>
              <td style=""><p align="center"><button id="btn" style="color: #fff;background-color: #2ba12b;font-size: 27px;width: 145px;padding: 4px;border-radius: 10px;">` + link + `</button></p></td></td>
              </tr>
              <br>
                     
              <tr>
                <td style="padding: 25px 15px 20px;">
                  Thanks &amp; Regards <br>  Leader developer
                </td>
              </tr>
              <tr>
                  <td style="text-align: center; padding: 20px; background-color: #4e555a; color: #eeeeee;">copyright @ Leader Developer For BlockChain </td>
              </tr>
          </tbody>
        </table>
        <p align="center"><button id="btn">dghbdhj</button></p>
      </div>
    </body>
   </html>`

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
        html: html, //"Click on this link to <a href=" + link + ">reset Password</a>",
        cc: cc,
        bcc: bcc
    }
    transporter.sendMail(messageObj, (err, info) => {
        // console.log("in send mail second console-----", err, info)
        if (err) {
            // console.log("Error occured", err)
            callback(null);
        } else {
            // console.log("Mail sent")
            callback(null, info)
        }
    })
}


// Send OTP on Resend Email otp on email.......................................................................................
exports.sendHtmlEmailOnResend = (email, subject, message, link, cc, bcc, name, callback) => {
    var userName = name
    var html = `<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="">
      <meta name="author" content="">
      <title>Vendor & Users</title>
    </head>
    <body style="margin: 0px; padding: 0px; background-color: #eeeeee;">
   
      <div style="width:600px; margin:20px auto; background:#fff; font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300;color:#777;line-height:30px">
   
        <table style="width: 100%; border: 1px solid #ccc;" cellpadding="0" cellspacing="0">
          <tbody>
              <tr style="background-color: #e7e7e7;">
                <td style="padding: 15px;">
                  <a href="#"><img src="{{$img}}" style="width:200px;"></a>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 15px 10px;">Dear ` + userName + `</td>
              </tr>
              <tr>
              <td style="padding: 10px 15px 10px;">This is your Anzen OTP. </td>
            </tr>
              <tr>
                <td style="padding: 10px 15px 10px;">Please input this code in your Anzen app.</td>
              </tr>
              <br>
              <tr>
              <td style=""><p align="center"><button id="btn" style="color: #fff;background-color: #2ba12b;font-size: 27px;width: 145px;padding: 4px;border-radius: 10px;">` + link + `</button></p></td></td>
              </tr>
              <br>     
              <tr>
                <td style="padding: 25px 15px 20px;">
                  Thanks &amp; Regards <br>  Anzen Wallet
                </td>
              </tr>
              <tr>
                  <td style="text-align: center; padding: 20px; background-color: #4e555a; color: #eeeeee;">copyright @ Anzen Wallet </td>
              </tr>
          </tbody>
        </table>
        <p align="center"><button id="btn">dghbdhj</button></p>
      </div>
    </body>
   </html>`
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
        html: html, //"Click on this link to <a href=" + link + ">reset Password</a>",
        cc: cc,
        bcc: bcc
    }
    transporter.sendMail(messageObj, (err, info) => {
        // console.log("in send mail second console-----", err, info)
        if (err) {
            // console.log("Error occured", err)
            callback(null);
        } else {
            // console.log("Mail sent")
            callback(null, info)
        }
    })
}


exports.sendHtmlEmailOnFogotPassword = (email, subject, message, link, cc, bcc, name, callback) => {
    console.log("obj===>>", message, link, name)
    var obj = {
        location: message,
        device: link,
        date: Date.now
    }
    console.log("obj======>>>>", obj)
    var userName = name
    var html = `<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="">
      <meta name="author" content="">
      <title>Vendor & Users</title>
    </head>
    <body style="margin: 0px; padding: 0px; background-color: #eeeeee;">
   
      <div style="width:600px; margin:20px auto; background:#fff; font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300;color:#777;line-height:30px">
   
        <table style="width: 100%; border: 1px solid #ccc;" cellpadding="0" cellspacing="0">
          <tbody>
              <tr style="background-color: #e7e7e7;">
                <td style="padding: 15px;">
                  <a href="#"><img src="{{$img}}" style="width:200px;"></a>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 15px 10px;">Dear ` + userName + `</td>
              </tr>
              <tr>
              <td style="padding: 10px 15px 10px;">You have successfully changed your account password on </td>
            </tr>
              <br>
              <th>Location</th>
              <td style="padding: 50px 15px 10px;"><center>` + obj.location + `</td>
              <tr style="padding: 50px 15px 10px;"><center>` + obj.device + `</tr>
              <br>     
              <tr>
                <td style="padding: 25px 15px 20px;">
                  Thanks &amp; Regards <br>  Anzen Wallet
                </td>
              </tr>
              <tr>
                  <td style="text-align: center; padding: 20px; background-color: #4e555a; color: #eeeeee;">copyright @ Anzen Wallet </td>
              </tr>
          </tbody>
        </table>
        <p align="center"><button id="btn">dghbdhj</button></p>
      </div>
    </body>
   </html>`
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
        html: html, //"Click on this link to <a href=" + link + ">reset Password</a>",
        cc: cc,
        bcc: bcc
    }
    transporter.sendMail(messageObj, (err, info) => {
        // console.log("in send mail second console-----", err, info)
        if (err) {
            // console.log("Error occured", err)
            callback(null);
        } else {
            // console.log("Mail sent")
            callback(null, info)
        }
    })
}