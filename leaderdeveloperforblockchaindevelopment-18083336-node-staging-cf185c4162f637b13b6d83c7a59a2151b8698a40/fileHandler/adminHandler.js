const mongoose = require('mongoose');
let admin = require('../models/admin.js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
var passphrase = require('passphrase');
let func = require('../fileHandler/function.js');
var bcrypt = require('bcryptjs');
var config = require("../config/config");
var message = require('../fileHandler/message');
var cloudinary = require('../fileHandler/uploadImage');
var announce = require("../models/announcement");
var each = require('async-each-series');
var userSchema = require('../models/user')
let User = require('../models/user.js');
const Fees = require('../models/commisionModel');
const request = require('request');
// var sanitizeHtml = require('sanitize-html');
const ObjectId = mongoose.Types.ObjectId;
// var Subtract = require('array-subtract');


module.exports = {


    "login": (req, res) => {
        console.log("trttttttt", req.body)
        admin.findOne({
            email: req.body.email
        }, (err, data) => {
            if (err)
                return func.responseHandler(res, 400, "Internal server error555.", err)
            else if (!data)
                return func.responseHandler(res, 500, "Email does not exists")
            else {
                console.log(data)
                bcrypt.compare(req.body.password, data.password, function (err_, match) {
                    if (match) {
                        console.log("trttttttt5656565")
                        console.log(match)
                        console.log(config.secret.secret_key)
                        var token = jwt.sign({
                            password: req.body.password
                        }, config.secret.secret_key);
                        console.log("token >>>>>>>>>", token)
                        admin.findOneAndUpdate({
                            email: req.body.email
                        }, {
                            $set: {
                                token: token
                            }
                        }, {
                            new: true
                        }, (err1, succ) => {
                            if (err1)
                                return func.responseHandler(res, 400, "Internal server error555.", err1)
                            else if (!succ)
                                return func.responseHandler(res, 500, "Token not found")
                            else {
                                console.log("succ===>", JSON.stringify(succ))
                                return func.responseHandler(res, 200, "Login Successfully", succ)
                            }
                        })
                    } else {
                        console.log('this is the err', err_)
                        return func.responseHandler(res, 400, "Password not matched");
                    }

                })
            }
        })

    },
//  admin forgot api send a email on admin registered Id .........And link only one time using..................
    forgot: (req, res) => {
        if (!req.body.email) {
            return func.responseHandler(res, 500, "Email is required")
        } else {
            req.body.email = req.body.email.toLowerCase();
            admin.findOne({
                email: req.body.email
            }, (err, success) => {
                if (err)
                    return func.responseHandler(res, 400, "Error occured", err);
                else if (!success)
                    return func.responseHandler(res, 500, "Email Id does not exists");
                else {
                    var adminId = success._id;
                    let otp = Math.floor(100000 + Math.random() * 900000)
                    // let link = "http://162.222.32.20:1434/forgot/" + adminId + 
                    // let link = "http://172.16.6.59:4200/reset/"+otp+"/" + adminId
                    let link = "http://162.222.32.20:1434/reset/"+otp+"/" + adminId
                    console.log("password=======>", req.body.password);
                    let html = `<h2 style="font-family:times new roman;">Dear Admin,<h2> </br> <p style="font-family:times new roman;"> Click on the below link to reset your Password<p> <a href=${link}>Click here</a>`;
                    message.sendEmail(req.body.email, "Regarding forgot password", html, link, null, null, (error, sent) => {
                        if (error) {
                            return func.responseHandler(res, 400, "Error occured", error);
                        } else {
                            admin.findOneAndUpdate({email: req.body.email},{$set:{forgotOtp:otp}},(err1, result1) => {
                                if (err1) {
                                    return func.responseHandler(res, 400, "Error occured.", error);
                                } 
                                else if(!result){
                                    return func.responseHandler(res, 200, "Invalid Token.")
                                }
                                else {

                                    return func.responseHandler(res, 200, "An link has been sent to the email address.")
                                }
                            })

                        }
                    })
                }

            })
        }
    },
   
    //  Admin go to link and come to reset password page ................and link only one time using................
    resetPassword: (req, res) => {
        console.log("req.params===>>>>",req.params)
        if(!req.params.adminId ||!req.params.otp)
        {
            return func.responseHandler(res, 400, "Parameter Missing.")
        }
       admin.findOne({_id:req.params.adminId},(err,result)=>{
           if(err){
            func.responseHandler(res, 400, "Invalid Token.",err)
           }
           else if(!result){
            func.responseHandler(res, 400, "Invalid Token.")
           }
           else{
              if(result.forgotOtp == req.params.otp)
              {
               func.bcrypt(req.body.newPassword,(errbcr,resultbcr)=>{
                   if(err){
                    func.responseHandler(res, 400, "Internal server error2.")
                   }
                   else{
                    let otp = Math.floor(100000 + Math.random() * 900000)
                    console.log("===>>>otp on reset password",otp)
                     admin.findOneAndUpdate({_id:ObjectId(req.params.adminId)},{$set:{forgotOtp:otp,password:resultbcr}},{new:true},(errSave,resultSave)=>{
                         if(errSave){
                            func.responseHandler(res, 400, "Invalid Token.")
                         }
                         else if(resultSave){
                            func.responseHandler(res, 200, "Successfully change your password.",resultSave)
                         }
                         else{
                            func.responseHandler(res, 400, "Invalid Token.")
                         }
                     })
                   }
               })
              }   
              else{
                func.responseHandler(res, 400, "Your Link is expired.")            
              }        
           }
       })
    },

    "logout": (req, res) => {
        console.log("~~~~~~~~~~~~~~~~~~@@@@@@@@@@@@@@@@@@@@")
        console.log("req for logout is " + JSON.stringify(req.body))
        if (!req.body)
            return func.responseHandler(res, 404, "Please fill the AdminId.")
        else {
            // User.update({_id:req.body.userId},{$set:{jwtToken:''}},(error_,result_)=>{ 
            admin.findByIdAndUpdate({
                _id: req.body._id
            }, {
                $set: {
                    token: ""
                }
            }, {
                new: true
            }, (error, result) => {
                if (error) {
                    console.log("error of logout " + JSON.stringify(error))
                    return func.responseHandler(res, 500, "Internal server error")
                } else if (!result) {
                    return func.responseHandler(res, 404, "Id not found")
                } else {
                    console.log("result of logout " + JSON.stringify(result))
                    return func.responseHandler(res, 200, "Admin logged out successfully.")
                }
            })
        }
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // 'addAnnouncement': (req, res) => {
    // console.log("@@Fgbgvbgvbgv")
    // announce.findOne({ _id: req.body.announcementId }, (error, result) => {
    // if (error)
    // return func.responseHandler(res, 500, "Internal server error");
    // else if (!result) {
    // var base64 = req.body.user.profilePic
    // cloudinary.uploadImage(base64, (err, result) => {
    // console.log("*********************")
    // req.body.user.profilePic = result
    // console.log("~~~~~~~~~", result)
    // var announce1 = new announce(req.body)
    // announce1.save((error1, result1) => {
    // if (error1)
    // return func.responseHandler(res, 500, "Internal server error1")
    // else {
    // return func.responseHandler(res, 200, "Announcement added successfully")
    // }
    // })
    // })
    // }
    // else if (result) {
    // var base64 = req.body.user.profilePic
    // cloudinary.uploadImage(base64, (err4, result4) => {
    // req.body.user.profilePic = result4
    // announce.findOne({ _id: req.body.announcementId, "user.userId": req.body.user.userId, }, (error3, result3) => {
    // console.log("result====>", result3);
    // if (error3)
    // func.responseHandler(res, 400, "Internal server error3.")
    // else if (!result3) {
    // var obj = {
    // userId: req.body.user.userId,
    // profilePic: req.body.user.profilePic,
    // userName: req.body.user.userName
    // };
    // console.log("OBJECT>>>>>>", obj);
    // announce.findOneAndUpdate({ _id: req.body.announcementId }, { $push: { "user": req.body.user }, $inc: { totalUser: 1 } }, { new: true, upsert: true, }, (error2, result2) => {

    // if (error2 || !result2)
    // return func.responseHandler(res, 500, "Internal server error2", error2);
    // else if (result2) {
    // return func.responseHandler(res, 200, " User added successfully")
    // }
    // })
    // }
    // else if (result3)
    // func.responseHandler(res, 401, "User Already Exist")

    // })

    // })
    // }

    // })

    // },


    'addAnnouncement': (req, res) => {
        console.log("@@Fgbgvbgvbgv")
        if (!req.body.icon || !req.body.title || !req.body.description || !req.body.startDate || !req.body.endDate || !req.body.user)
            func.responseHandler(res, 401, "Please provide input fields")
        else {
            var base64 = req.body.icon;
            cloudinary.uploadImage(base64, (err, result) => {
                console.log("*********************")
                req.body.icon = result;
                console.log("~~~~~~~~~", result);
                let count = req.body.user.length;
                console.log("count))))))))", count)
                req.body.totalUser = count;
                var announce1 = new announce(req.body);
                announce1.save((error1, result1) => {
                    if (error1 || !result1)
                        return func.responseHandler(res, 500, "Internal server error1", error1)
                    else {
                        return func.responseHandler(res, 200, "Announcement added successfully")
                    }
                })
            })
        }
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    'editAnnouncement': (req, res) => {
        announce.findOne({
            _id: req.body.announcementId
        }, (error, result) => {
            if (error)
                return func.responseHandler(res, 500, "Internal server error");
            else if (!result) {
                return func.responseHandler(res, 401, "Announcement not found")
            } else if (result) {
                var obj = {
                    title: req.body.title,
                    description: req.body.description,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    user: req.body.user
                };
                // let count = req.body.user.length;
                // req.body.totalUser = count;
                announce.findOneAndUpdate({
                    _id: req.body.announcementId
                }, req.body, {
                    new: true,
                    upsert: true,
                }, (error2, result2) => {

                    if (error2 || !result2)
                        return func.responseHandler(res, 500, "Internal server error2", error2);
                    else if (result2) {
                        return func.responseHandler(res, 200, " Announcement editted successfully")
                    }
                })
            }
        })
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    'getAllAnnouncement': (req, res) => {
        let options = {
            page: req.body.pageNumber || 1,
            select: 'title startDate endDate totalUser',
            // limit:,
            sort: {
                createdAt: 1
            },
        }
        announce.paginate({
            status: "ACTIVE"
        }, options, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (result.length < 1)
                func.responseHandler(res, 401, "No Announcement found")
            else if (result) {
                return func.responseHandler(res, 200, "All Announcement found successfully", result)
            }
        })
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    'announcementInfo': (req, res) => {
        announce.aggregate([{
                $match: {
                    "_id": ObjectId(req.body.announcementId)
                }
            },
            {
                $unwind: "$user"
            },
            {
                $match: {
                    "user.status": "ACTIVE"
                }
            },
            {
                $group: {
                    "_id": "$_id",
                    "user": {
                        "$addToSet": "$user"
                    },
                    "title": {
                        "$first": "$title"
                    },
                    "description": {
                        "$first": "$description"
                    },
                    "startDate": {
                        "$first": "$startDate"
                    },
                    "endDate": {
                        "$first": "$endDate"
                    },
                    "icon": {
                        "$first": "$icon"
                    },
                }
            }
        ]).exec((error, result) => {
            if (error)
                return func.responseHandler(res, 400, "Internal server error.")
            else if (!result) {
                return func.responseHandler(res, 401, "No Announcement found")
            } else if (result) {
                return func.responseHandler(res, 200, "Announcement found successfully", result);
            }

        })

    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    'deleteAnnouncement': (req, res) => {
        announce.findOneAndUpdate({
            '_id': req.body.announcementId
        }, {
            $set: {
                'status': "INACTIVE"
            }
        }, {
            new: true
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No Announcement found")
            else if (result) {
                return func.responseHandler(res, 200, "Announcement deleted successfully", result);
            }
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'removeUser': (req, res) => {
        announce.findOne({
            "_id": req.body.announcementId
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No Announcement found")
            else if (result) {
                console.log("result===>", result);
                announce.findOneAndUpdate({
                    "_id": req.body.announcementId,
                    "user._id": req.body.userId
                }, {
                    $pull: {
                        "user": {
                            _id: req.body.userId
                        }
                    },
                    $inc: {
                        totalUser: -1
                    }
                }, (error1, result1) => {
                    console.log("resul1t===>", result1);
                    if (error1)
                        func.responseHandler(res, 400, "Internal server error.", error1)
                    else if (!result1)
                        func.responseHandler(res, 401, "User id not found")
                    else if (result1)
                        return func.responseHandler(res, 200, "User Removed successfully")
                })
            }
        })
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    "getProfile": (req, res) => {
        console.log("requested id is" + req.headers._id);
        admin.findOne({
            _id: req.headers._id
        }, {
            password: 0,
            token: 0,
            __v: 0
        }, (error, result) => {
            if (error)
                return func.responseHandler(res, 400, "something went wrong.", error)
            else if (!result) {
                return func.responseHandler(res, 404, "data not found", result)
            } else {
                console.log("Admin Details-------->", result)
                return func.responseHandler(res, 200, "Details found successfully", result)
            }
        })


    },

    "updateProfile": (req, res) => {
        console.log("updateProfile=======>", req.body)
        admin.findOne({
            _id: req.body.adminId,
            status: "ACTIVE"
        }, (err, success) => {
            if (err)
                return func.responseHandler(res, 400, "something went wrong");
            else if (!success)
                return func.responseHandler(res, 404, "Admin Not found");
            else {
                admin.findOneAndUpdate({
                    _id: req.body.adminId,
                    status: "ACTIVE"
                }, {
                    $set: {
                        userName: req.body.userName,
                        address: req.body.address,
                        mobileNumber: req.body.mobileNumber
                    }
                }, {
                    new: true
                }, (err2, final) => {
                    if (err2 || !final)
                        return func.responseHandler(res, 500, "Error Occured.", err2)
                    else if (final) {
                        delete final.password;
                        return func.responseHandler(res, 200, "Your profile updated successfully.")

                    }

                })
            }
        })
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    "changePassword": (req, res) => {
        if (!req.body.oldPassword || !req.body.newPassword || !req.body.confirmPassword)
            return func.responseHandler(res, 400, "Please provide all required data.");

        console.log("Change password request " + JSON.stringify(req.body))
        admin.findOne({}, (err, success) => {
            if (err) {
                console.log("Data of change pass>>>>>>>>>>>>>>", err)
                return func.responseHandler(res, 500, "Internal Server Error");
            } else if (!success)
                return func.responseHandler(res, 404, "Admin Id not exists");

            else if (success) {
                bcrypt.compare(req.body.oldPassword, success.password, (err, result) => {
                    console.log("err>>>>>>", err, "result of change>>>>", result);
                    if (result) {
                        if (req.body.newPassword != req.body.confirmPassword) {
                            return func.responseHandler(res, 401, " New password Mismatch");
                        }
                        let salt = bcrypt.genSaltSync(10);
                        success.password = bcrypt.hashSync(req.body.newPassword, salt)
                        success.save((err, success) => {
                            if (err) {
                                return func.responseHandler(res, 400, "Password not updated");
                            } else {

                                return func.responseHandler(res, 200, "Password updated successfully");

                            }
                        })
                    } else if (!result)
                        return func.responseHandler(res, 404, "Old password is not correct")
                    else if (err) {
                        return func.responseHandler(res, 400, "Error occured", err);
                    }
                })
            }
        })

    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 


    'commision': (req, res) => {
        if (!req.body.commision || !req.body.tokenName || !req.body.tokenId) {
            console.log("dffffffff")
            func.responseHandler(res, 401, "Parameters missing.")
        } else {
            Fees.find((error, result) => {
                if (error) {
                    return func.responseHandler(res, 400, "Internal server error.")
                } else if (!result)
                    func.responseHandler(res, 401, "This id does not exist.")
                else if (result.length == 0) {
                    var user = new Fees(req.body);
                    user.save((error1, result1) => {
                        if (error1) {
                            return func.responseHandler(res, 400, "Internal server error.")
                        } else return
                        func.responseHandler(res, 200, "Commision saved successfully.")
                    });
                } else if (result.length != 0) {
                    Fees.findOne({
                        "tokenName": req.body.tokenName,
                        "tokenId": req.body.tokenId
                    }, (error1, result1) => {
                        if (error1) {
                            return func.responseHandler(res, 400, "Internal server error.")
                        } else if (result1) {
                            Fees.findOneAndUpdate({
                                "tokenId": req.body.tokenId
                            }, {
                                $set: {
                                    "commision": req.body.commision
                                }
                            }, (error2, result2) => {
                                if (error2) {
                                    return func.responseHandler(res, 400, "Internal server error.")
                                } else if (result2) return func.responseHandler(res, 200, "Commision updated successfully.")
                            })
                        } else if (!result1) {
                            var user1 = new Fees(req.body);
                            user1.save((error11, result11) => {
                                if (error11) {
                                    return func.responseHandler(res, 400, "Internal server error.")
                                } else if (result11) return func.responseHandler(res, 200, "Commision saved successfully.")
                            });
                        }
                    })
                }
            })
        }
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'editUser': (req, res) => {
        var obj = {
            $and: [{
                _id: req.body.userId,
                status: "ACTIVE"
            }]
        }
        User.findOne(obj, (error, result) => {

            if (error) {
                return func.responseHandler(res, 400, "Error occured", error);
            } else if (!result) {
                func.responseHandler(res, 401, "User not found")
            } else if (result) {
                User.findByIdAndUpdate({
                    _id: req.body.userId
                }, {
                    $set: {
                        userName: req.body.userName
                    }
                }, {
                    new: true
                }).lean().exec((error, result) => {
                    if (error || !result) {
                        return func.responseHandler(res, 400, "Error occurred");
                    } else if (result) {
                        announce.update({
                            "user._id": req.body.userId
                        }, {
                            $set: {
                                "user.$.userName": req.body.userName
                            }
                        }, {
                            new: true,
                            multi: true
                        }, (err, success) => {
                            if (err || !success) {
                                return func.responseHandler(res, 400, "Error occurred");
                            } else if (success) {
                                func.responseHandler(res, 200, "UserName updatted successfully")
                            }
                        })

                    }
                })
            }

        })
    },
    // change status of user ATIVE/Block to DEactive then user never show  in admin panel ..................................................
    'deleteUser': (req, res) => {
        User.findOneAndRemove({
            _id: req.body.userId
        }, (error, result) => {
            if (error) {
                return func.responseHandler(res, 400, "Error occured ");
            } else if (!result) {
                func.responseHandler(res, 401, "User not found")
            } else if (result) {
                console.log("result====>>", result)
                func.responseHandler(res, 200, "User deleted successfully")
            }
        })
    },

    'getUserListNew': (req, res) => {
        var value = new RegExp('^' + req.body.search, "i")
        var obj
        if (!req.body.search) {
            obj = {
                $and: [{}, {
                    status: "ACTIVE"
                }]
            }
        } else if (req.body.search) {
            obj = {
                $and: [{
                    $or: [{
                        userName: value
                    }, {
                        email: value
                    }, {
                        mobileNumber: value
                    }]
                }, {
                    status: "ACTIVE"
                }]
            }
        }

        User.find(obj, {
            userName: 1,
            status: 1
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result)
                return func.responseHandler(res, 200, "All user found successfully", result)
        })
    },

    //  show users only active and blocked ....................................................................................
    'getUserList': (req, res) => {
        var value = new RegExp('^' + req.body.search, "i")
        var obj
        if (!req.body.search) {
            console.log("in if")
            obj = {
                status: {
                    $ne: "DEACTIVE"
                }
            }
        } else if (req.body.search) {
            console.log("in else")
            obj = {
                $and: [{
                    status: {
                        $ne: "DEACTIVE"
                    }
                }, {
                    $or: [{
                        userName: value
                    }, {
                        email: value
                    }, {
                        mobileNumber: value
                    }]
                }]
            }
        }
        let options = {
            page: req.body.pageNumber || 1,
            select: 'userName email mobileNumber status signInHistoryArray.deviceId signInHistoryArray.signInTime walletAddress',
            limit: 10,
            sort: {
                createdAt: -1
            },
            lean: false
        }
        console.log("obj===<>>", obj)
        User.paginate(obj, options, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result)
                console.log("result====>>", result)
            return func.responseHandler(res, 200, "All user found successfully", result)
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'getUserInfo': (req, res) => {

        User.findOne({
            "_id": req.body.userId,
            status: "ACTIVE"
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result)
                return func.responseHandler(res, 200, "User found successfully", result)
        })
    },


    'changeStatus': (req, res) => {
        User.findOne({
            _id: req.body._id
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found.")
            else if (result) {
                if (result.status == "ACTIVE") {
                    User.findOneAndUpdate({
                        "_id": req.body._id
                    }, {
                        $set: {
                            "status": "BLOCK"
                        }
                    }, (error, result) => {
                        if (error)
                            func.responseHandler(res, 400, "Internal server error.")
                        else if (result) {
                            announce.update({
                                "user._id": req.body._id
                            }, {
                                $set: {
                                    "user.$.status": "DEACTIVE"
                                }
                            }, {
                                new: true,
                                multi: true
                            }, (err, success) => {
                                if (err || !success) {
                                    return func.responseHandler(res, 400, "Error occurred");
                                } else if (success) {
                                    return func.responseHandler(res, 200, "User blocked successfully.")
                                }
                            })

                        }
                    })
                } else if (result.status == "BLOCK") {
                    User.findOneAndUpdate({
                        "_id": req.body._id
                    }, {
                        $set: {
                            "status": "ACTIVE"
                        }
                    }, (error, result) => {
                        if (error)
                            func.responseHandler(res, 400, "Internal server error.")
                        else if (result) {
                            announce.update({
                                "user._id": req.body._id
                            }, {
                                $set: {
                                    "user.$.status": "ACTIVE"
                                }
                            }, {
                                new: true,
                                multi: true
                            }, (err, success) => {
                                if (err || !success) {
                                    return func.responseHandler(res, 400, "Error occurred");
                                } else if (success) {
                                    return func.responseHandler(res, 200, "User active successfully.")
                                }
                            })

                        }
                    })
                }
            }
        })
    },


    // show user login history .............in user management admin panel ...........................
    'userDeviceHistory': (req, res) => {
        let m = req.body.limit || 10
        let n = req.body.page || 1
        User.findOne({
            walletAddress: req.params.walletAddress
        }, {
            signInHistoryArray: 1,
            walletAddress: 1,
            userName: 1,
            email: 1
        }).lean().exec((error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result) {
                console.log("result==>>>", result)
                var userList = result.signInHistoryArray;
                console.log("result.signInHistoryArray", userList);
                var userList = userList.slice((n - 1) * m, n * m)
                let final = {
                    data: userList,
                    page: n,
                    limit: m,
                    total: userList.length,
                    pages: Math.ceil(userList.length / m)
                }
                return func.responseHandler(res, 200, "Success.", final)
            }
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    "typeFilter": (req, res) => {
        var value = new RegExp('^' + req.body.type, "i")
        var obj = {
            "_id": req.body._id
        }
        if (!req.body.type) {
            obj = {}
        } else if (req.body.search) {
            obj = {
                type: value
            }
        }

        let options = {
            page: req.body.pageNumber || 1,
            select: 'type address amount dateTime transactionHash',
            limit: 3,
            sort: {
                createdAt: -1
            },
            lean: false
        }
        User.paginate(obj, options, (err, data) => {
            if (err)
                return func.responseHandler(res, 400, "Internal server error.")

            else if (!data)
                return func.responseHandler(res, 401, "No data found")

            else if (data)
                return func.responseHandler(res, 200, "Success.", data.docs)

        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    userTransactionHistory: function (req, res, ) {
        console.log("We are in Deposits Api")
        if (!req.body.walletAddress) {
            return res.send({
                code: 400,
                message: "Parameters Missing!!"
            })
        }
        var dataString = {
            "name": req.query.walletAddress,
        }
        var options = {
            url: 'http://api-ropsten.etherscan.io/api?module=account&action=txlist&address=' + req.body.walletAddress + '&sort=desc',
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataString)
        };

        function callback(error, response, body) {

            if (!error && response.statusCode == 200) {

                res.send({
                    code: 200,
                    deposits: JSON.parse(body)
                })
            } else
                res.send({
                    code: 500,
                    message: "Internal Sever Error"
                })
        }
        request(options, callback);
    },

    // show number of count in Admin panel (Number of count only those users that has status ACTIVE/BLOCK)..............    
    countUser: (req, res) => {
        var query = {$and:[{status:{$ne:"DEACTIVE"}},{status:{$ne:"DELETE"}}]}
        User.find(query).count().exec((error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result) {
                return func.responseHandler(res, 200, "Count of user found successfully", result)
            }
        })
    },


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

    'countAnnouncement': (req, res) => {
        announce.find({
            status: "ACTIVE"
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result) {

                return func.responseHandler(res, 200, "Count of user found successfully", result.length)
            }
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'getAnnouncementUserList': (req, res) => {
        var value = new RegExp('^' + req.body.search, "i")
        var obj = {
            status: "ACTIVE"
        };
        User.find(obj, {
            userName: 1,
            status: 1
        }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (!result)
                func.responseHandler(res, 401, "No user found")
            else if (result)
                // return func.responseHandler(res, 200, "All user found successfully", result)
                var obj = result;
            console.log("obj==============>", obj);
            announce.aggregate([{
                    $match: {
                        "_id": ObjectId(req.body.announcementId)
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $match: {
                        "user.status": "ACTIVE"
                    }
                },
                {
                    $group: {
                        "_id": "$_id",
                        "user": {
                            "$addToSet": "$user"
                        },
                        "title": {
                            "$first": "$title"
                        },
                        "description": {
                            "$first": "$description"
                        },
                        "startDate": {
                            "$first": "$startDate"
                        },
                        "endDate": {
                            "$first": "$endDate"
                        },
                        "icon": {
                            "$first": "$icon"
                        },
                    }
                }
            ]).exec((error1, result1) => {
                if (error1)
                    return func.responseHandler(res, 400, "Internal server error.")
                else if (!result1) {
                    return func.responseHandler(res, 401, "No Announcement found")
                } else if (result1) {
                    // return func.responseHandler(res, 200, "Announcement found successfully", result);

                    var obj1 = [];
                    obj1 = result1[0].user;
                    console.log("obj1==========>", obj1);
                    if (obj1.length !== 0) {
                        console.log("obj1", obj1);
                        var final = obj.concat(obj1);

                        function comparer(otherArray) {
                            return function (current) {
                                return otherArray.filter(function (other) {
                                    return other._id == current._id
                                }).length == 0;
                            }
                        }
                        var newArray = obj.filter(comparer(obj1));
                    } else {
                        newArray = [];
                        console.log("helloo");
                    }
                    return func.responseHandler(res, 200, "User List of Announcement found successfully", newArray);
                }

            })
        })
    },

}