const mongoose = require('mongoose')
var Web3 = require('web3');
// var web3 = new Web3(Web3.givenProvider || 'https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f');
var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io');
var Accounts = require('web3-eth-accounts');
// var accounts = new Accounts('https://ropsten.infura.io/');
var accounts = new Accounts('https://mainnet.infura.io/');
let admin = require('../models/admin.js')
let User = require('../models/user.js')
let staticContent = require('../models/staticContentModel.js')
let tokenList = require('../models/tokenList.js')
let func = require('../fileHandler/function.js')
let eth = require('../fileHandler/eth.js')
let ethereum = require('../fileHandler/ethereum.js')
let Askquery = require('../models/query.js')
let each = require('async-each-series')
var fs = require('fs')
let Tx = require('ethereumjs-tx')
var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'))
var BigNumber = require('bignumber.js')
const numberToBN = require('number-to-bn')
module.exports = {
    /*=====================================================================================================================================================/
/                                                          USER APP APIS                                                                               /
/=====================================================================================================================================================*/
    signUp: (req, res) => {
        if (!req.body.email || !req.body.userName || !req.body.mobileNumber || !req.body.password || !req.body.deviceId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            email: req.body.email,
            status: "ACTIVE"
        }, (no, yes) => {
            if (no) {
                return func.responseHandler(res, 400, "Internal Server Error.")
            } else if (yes) {
                return func.responseHandler(res, 400, "Email-ID is alredy Exist.")
            } else {
                func.createPass((err1, passphrase) => {
                    if (err1) {
                        return func.responseHandler(res, 400, "Internal Server Error.", err1)
                    } else {
                        func.bcrypt(req.body.password, (err2, bcrPassword) => {
                            if (err2) {
                                return func.responseHandler(res, 400, "Internal Server Error.", err2)
                            } else {
                                var random = Math.floor(100000 + Math.random() * 900000)
                                func.sendHtmlEmail(req.body.email, "Anzen wallet", null, "" + "<b> <h3 > <h3> <b>" + random, null, null, req.body.userName, (err3, emailOtp) => {
                                    if (err3) {
                                        return func.responseHandler(res, 400, "Internal Server Error.", err3)
                                    } else {
                                        // console.log("otp for email====>", random)
                                        var mobileOtp = Math.floor(100000 + Math.random() * 900000)
                                        func.sendMessageNexmo(req.body.mobileNumber, mobileOtp, (err4, mobileOtp) => {
                                            if (err4) {
                                                return func.responseHandler(res, 400, "Internal Server Error4.", err4)
                                            } else {
                                                // console.log("otp for mobile====>", mobileOtp)
                                                eth.createWallet(req.body.password, (err5, wallet) => {
                                                    if (err5) {
                                                        return func.responseHandler(res, 400, "Internal server error5.")
                                                    } else {
                                                        console.log("======>>>", wallet)
                                                        var objJWT = {
                                                            email: req.body.email,
                                                            passphrase: passphrase,
                                                            number: req.body.mobileNumber,
                                                            password: bcrPassword
                                                        }
                                                        func.jwt(objJWT, (err6, jwtToken) => {
                                                            if (err6) {
                                                                return func.responseHandler(res, 400, "Internal server error6.")
                                                            } else {
                                                                // console.log("jwt token", jwtToken)
                                                                var obj = {
                                                                    email: req.body.email,
                                                                    userName: req.body.userName,
                                                                    mobileNumber: req.body.mobileNumber,
                                                                    password: bcrPassword,
                                                                    passphrase: passphrase,
                                                                    emailOtp: random,
                                                                    mobileOtp: mobileOtp,
                                                                    walletAddress: wallet.address,
                                                                    privateKey: wallet.privateKey
                                                                }

                                                                new User(obj).save((err8, result8) => {
                                                                    if (err8) {
                                                                        return func.responseHandler(res, 400, "Internal Server Error8.", err8)
                                                                    } else {
                                                                        // console.log("in success")
                                                                        delete obj['privateKey']
                                                                        delete obj['password']
                                                                        // delete obj['emailOtp']
                                                                        // delete obj['mobileOtp']

                                                                        obj["jwt"] = jwtToken
                                                                        // delete obj[data]
                                                                        return func.responseHandler(res, 200, "Success.", obj)
                                                                    }
                                                                })
                                                            }
                                                        })

                                                    }
                                                })

                                            }
                                        })

                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    },
    // page 15--->>>     input code verification verify to user email otp on email and mobile.........................
    inputCodeVerfication: (req, res) => {
        if (!req.body.emailOtp || !req.body.mobileOtp || !req.body.email || !req.body.walletAddress || !req.body.location || !req.body.deviceId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }

        var obj = {
            deviceId: req.body.deviceId,
            signInTime: Date.now(),
            location: req.body.location,
            status: "signIn",
            signOutTime: 0
        }
        var query = {
            email: req.body.email,
            walletAddress: req.body.walletAddress,
            emailOtp: req.body.emailOtp,
            mobileOtp: req.body.mobileOtp
        }
        var obj1 = {
            $addToSet: {
                deviceId: req.body.deviceId
            },
            $push: {
                signInHistoryArray: {
                    $each: [obj],
                    $position: 0
                }
            },
            $set: {
                status: "ACTIVE"
            }
        }
        User.findOneAndUpdate(query, obj1, {
            new: true
        }, (err, result) => {
            console.log("err,result", err, result)
            if (err) {
                // console.log("result===>>>>".result)
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                console.log("result===>>>>".result)
                return func.responseHandler(res, 200, "Success.", result)
            } else {
                return func.responseHandler(res, 401, "Invalid Credentials.")
            }
        })
    },
    // page-->>15    resend otp on email....................................................................................................
    resendEmailOtp: (req, res) => {
        if (!req.body.email || !req.body.walletAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }

        User.findOne({
            walletAddress: req.body.walletAddress,
            email: req.body.email
        }, (err, result) => {
            console.log("err==result===>>", err, result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 200, "Invalid Credentials.")
            } else {
                let random = Math.floor(100000 + Math.random() * 900000)
                console.log("random===>>>", random)
                // func.sendHtmlEmail(req.body.email, "Leader Developer", null, "" + "<b> <h3 > <h3> <b>" + random, null, null, req.body.userName, (err3, emailOtp) => {
                func.sendHtmlEmailOnResend(req.body.email, "Anzen Wallet", null, "" + "<b><b>" + random, null, null, result.userName, (err1, emailOtp) => {
                    if (err2) {
                        console.log("err in sending otp on mobile ")
                    } else {
                        console.log("mobile otp success==>>", emailOtp)
                    }
                })
                User.findOneAndUpdate({
                    email: req.body.email
                }, {
                    $set: {
                        emailOtp: random
                    }
                }, (errOtp, result) => {
                    if (errOtp) {
                        return func.responseHandler(res, 400, "Internal server error.")
                    } else {
                        return func.responseHandler(res, 200, "Success.")
                    }
                })
            }
        })
    },
    // page-->>15    resend otp on mobile....................................................................................................
    resendMobileOtp: (req, res) => {
        if (!req.body.email || !req.body.walletAddress || !req.body.mobileNumber) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        let otp = Math.floor(100000 + Math.random() * 900000)
        console.log("otp===>>>", otp)
        func.sendMessageNexmo(req.body.mobileNumber, otp, (err2, mobileOtp) => {
            if (err2) {
                console.log("err in sending otp on mobile ")
            } else {
                console.log("mobile otp success==>>", mobileOtp)
            }
        })

        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress,
            email: req.body.email
        }, {
            $set: {
                "mobileOtp": otp
            }
        }, (err, result) => {
            console.log("err==result===>>", err, result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    //  page --> 18     .......  enable finger print to sign in in next time ...............................
    enableFingerPrintTouch: (req, res) => {
        if (!req.body.walletAddress || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress,
            email: req.body.email
        }, {
            $set: {
                "fingerPrint": "ON"
            }
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                return func.responseHandler(res, 200, "Success.")
            } else {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            }
        })
    },
    //  page --> 19     .......  enable face detection to sign in in next time ...............................
    enableFaceDetection: (req, res) => {
        if (!req.body.walletAddress || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress,
            email: req.body.email
        }, {
            $set: {
                "faceDetection": "ON"
            }
        }, {
            new: true
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                return func.responseHandler(res, 200, "Success.")
            } else {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            }
        })
    },
    // page 34---->>    show accont option in setting..................................................
    accountDetails: (req, res) => {
        if (!req.body.walletAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress
        }, {
            name: 1,
            mobileNumber: 1,
            passphrase: 1,
            email: 1,
            _id: 0
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            } else {
                return func.responseHandler(res, 200, "Success.", result)
            }
        })
    },
    // page 34--->>> change mobile number and send otp on new number to verify
    accoutnDetailsSendOtp: (req, res) => {
        console.log("req.body===>>", req.body)
        if (!req.body.walletAddress || !req.body.email || !req.body.mobileNumber) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        let otp = Math.floor(100000 + Math.random() * 900000)
        console.log("otp===>>>", otp)
        func.sendMessageNexmo(req.body.mobileNumber, otp, (err2, mobileOtp) => {
            if (err2) {
                console.log("err in sending otp on mobile ")
            } else {
                console.log("mobile otp success==>>", mobileOtp)
            }
        })
        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress,
            email: req.body.email,
        }, {
            $set: {
                "mobileOtp": otp
            }
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                return func.responseHandler(res, 200, "Success.")
            } else {
                return func.responseHandler(res, 401, "Invalid credentails.")
            }
        })
    },
    // page 34--->>  change account information (APi work with app & website also .............................................)
    accountDetailsSaveChanges: (req, res) => {
        if (!req.body.walletAddress || !req.body.email || !req.body.name || !req.body.mobileNumber || !req.body.passphrase || !req.body.passphraseNumber) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            console.log("err,result===>>", err, result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                var a = result.passphrase.split(' ')
                console.log("a===>>", a, a.indexOf(req.body.passphrase), req.body.passphraseNumber - 1)
                console.log("============>>>>", a.indexOf(req.body.passphrase))
                if (a.indexOf(req.body.passphrase) == req.body.passphraseNumber - 1) {
                    var obj1 = {
                        $set: {
                            userName: req.body.name,
                            mobileNumber: req.body.mobileNumber,
                            email: req.body.email
                        }
                    }
                    User.findOne({
                        $and: [{
                            status: "ACTIVE"
                        }, {
                            $or: [{
                                email: req.body.email
                            }, {
                                mobileNumber: req.body.mobileNumber
                            }]
                        }]
                    }, (err_, result_) => {
                        if (err_) {
                            return func.responseHandler(res, 400, "Internal server error.")
                        } else if (result_) {
                            return func.responseHandler(res, 200, "Another User Exist with this details.")
                        } else {
                            User.findOneAndUpdate({
                                walletAddress: req.body.walletAddress
                            }, obj1, (err1, result2) => {
                                if (err1) {
                                    return func.responseHandler(res, 400, "Internal Server Error.")
                                } else {
                                    return func.responseHandler(res, 200, "Success.")
                                }
                            })
                        }
                    })
                } else {
                    return func.responseHandler(res, 401, "Invalid Passphrase.")
                }
            } else {
                return func.responseHandler(res, 401, "Invalid credentails.")
            }
        })
    },
    // change Password on page no. 33........................................................
    changePassword: (req, res) => {
        if (!req.body.passphrase || !req.body.currentPassword || !req.body.newPassword || !req.body.passphraseNumber || !req.body.walletAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error1.", err)
            } else if (!result) {
                return func.responseHandler(res, 401, "Invalid credentails.")
            } else {
                func.bcryptVerify(req.body.currentPassword, result.password, (err_, result_) => {
                    console.log("err or result ===>>", err_, result_)
                    if (err_) {
                        return func.responseHandler(res, 400, "Internal server error.")
                    } else if (result_ == false) {
                        return func.responseHandler(res, 404, "Your current password not matched.")
                    } else {
                        var a = result.passphrase.split(' ')
                        console.log("a===>>", a, a.indexOf(req.body.passphrase), req.body.passphraseNumber - 1)
                        // console.log("============>>>>", a.indexOf(req.body.passphrase))
                        if (a.indexOf(req.body.passphrase) == req.body.passphraseNumber - 1) {
                            func.bcrypt(req.body.newPassword, (err1, bcrPassword) => {
                                if (err1) {
                                    return func.responseHandler(res, 400, "Internal server error.")
                                } else {
                                    User.findOneAndUpdate({
                                        walletAddress: req.body.walletAddress
                                    }, {
                                        $set: {
                                            password: bcrPassword
                                        }
                                    }, {
                                        new: true
                                    }, (err2, result2) => {
                                        if (err2) {
                                            return func.responseHandler(res, 400, "Internal server error.")
                                        } else {
                                            return func.responseHandler(res, 200, "Success.")
                                        }
                                    })
                                }
                            })
                        } else {
                            return func.responseHandler(res, 404, "Invalid Passphrase.")
                        }
                    }
                })
            }
        })

    },
    // page -->>  42 Ask query ...... send mail to admin .................................................
    Askquery: (req, res) => {
        if (!req.body.walletAddress || !req.body.email || !req.body.subject || !req.body.data || !req.body.name) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var obj = {
            walletAddress: req.body.walletAddress,
            userEmail: req.body.email,
            subject: req.body.subject,
            data: req.body.data,
            name: req.body.name
        }
        admin.findOne({}, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else {
                console.log("result=====>>>", result)
                func.sendEmail(result.email, req.body.subject, req.body.data, null, null, null, (err1, sendEmail) => {
                    if (err1) {
                        console.log("err in sending otp on mobile ")
                    } else {
                        console.log("mobile otp success==>>", sendEmail)
                    }
                })
            }
        })
        new Askquery(obj).save((err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    // page--> 31 ...............to show sigin in history to user when user login (This api is use in app and Website both website has filter according to device name but user app has no filter ) 
    SigninHistory: (req, res) => {
        var query2 = {};
        console.log("=====>>>", req.body)
        if (req.body.walletAddress || req.body.email) {
            var query = {
                walletAddress: req.body.walletAddress
            }
        }
        if (req.body.search) {
            query2 = {
                "signInHistoryArray.deviceId": {
                    $regex: req.body.search,
                    $options: "i"
                }
            }
        }
        let options = {
            page: req.body.pageNumber || 1,
            limit: req.body.pageLimit || 10
        }
        var aggregate = User.aggregate([{
                $match: query
            },
            {
                $unwind: "$signInHistoryArray"
            },
            {
                $match: query2
            },
            {
                $project: {
                    signInHistoryArray: 1
                }
            }
        ])
        User.aggregatePaginate(aggregate, options, (err, result, pages, total) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            } else {
                let doc = {
                    result: result,
                    total: total,
                    pages: pages,
                    page: options.page,
                    limit: options.limit
                }
                return func.responseHandler(res, 200, "Success.", doc)
            }

        })

    },

    // page -->  2    ................user signin....................
    signin: (req, res) => {
        if (!req.body.email || !req.body.password || !req.body.deviceId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var objJWT = {
            email: req.body.email,
            password: req.body.Password
        }
        User.findOne({
            email: req.body.email,
            status: "ACTIVE"
        }, {
            emailOtp: 0
        }).lean().exec((err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                // console.log("in bcrypt")
                func.bcryptVerify(req.body.password, result.password, (err1, result1) => {
                    if (err1) {
                        return func.responseHandler(res, 401, "Please provide valid email.")
                    } else if (result1) {
                        //  to check device if device id is already exit then send otp on mobile for 2 FA
                        console.log("password is matched ====>>>>>>>")
                        User.findOne({
                            $and: [{
                                email: req.body.email
                            }, {
                                deviceId: {
                                    $in: [req.body.deviceId]
                                }
                            }]
                        }, (err1, result2) => {
                            if (err1) {
                                return func.responseHandler(res, 400, "Internal server error1.")
                            }
                            //  when device id not found ....................
                            else if (!result2) {
                                console.log(" ************************************** User login to new Device **************************************")
                                func.jwt(objJWT, (errJwt, jwtToken) => {
                                    console.log("************* user login to new device in jwt function *************** ", errJwt, jwtToken)
                                    if (errJwt) {
                                        return func.responseHandler(res, 400, "Error in jwt.")
                                    } else {
                                        console.log("in jwt success section ******************")
                                        delete result['privateKey']
                                        var final = {
                                            result: result,
                                            jwt: jwtToken
                                        };
                                        return func.responseHandler(res, 411, "Success.", final)
                                    }
                                })

                            } else {
                                //  device Id found then send to otp on user mobile.......................
                                console.log(" ************************************** User login to same Device **************************************")
                                var otp = Math.floor(100000 + Math.random() * 900000)
                                console.log("otp===>>", otp)
                                func.sendMessageNexmo(result2.mobileNumber, otp, (err, mobileOtp) => {
                                    if (err) {
                                        return func.responseHandler(res, 400, "Could not sent otp.")
                                    } else {
                                        User.findOneAndUpdate({
                                            email: req.body.email
                                        }, {
                                            $set: {
                                                mobileOtp: otp
                                            }
                                        }, {
                                            new: true
                                        }).lean().exec((err, result) => {
                                            if (err) {
                                                return func.responseHandler(res, 400, "Internal server error.")
                                            } else {
                                                func.jwt(objJWT, (errJwt, jwtToken) => {
                                                    if (errJwt) {
                                                        return func.responseHandler(res, 400, "Error in jwt.")
                                                    } else {
                                                        delete result['privateKey']
                                                        var final = {
                                                            result: result,
                                                            jwt: jwtToken
                                                        };
                                                        return func.responseHandler(res, 410, "Success.", final)
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })

                            }
                        })
                    } else {
                        return func.responseHandler(res, 401, "Invalid credentials.")
                    }
                })

            } else {
                return func.responseHandler(res, 401, "Invalid credentials.")
            }
        })

    },
    // verify the finger print .............................................................
    fingerPrintVerify: (req, res) => {
        if (!req.body.fingerUrl || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            email: req.body.email,
            status: "ACTIVE"
        }, {
            $set: {
                fingerPrintUrl: req.body.fingerUrl
            }
        }, {
            new: true
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 401, "No result found.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    //  to verfiy the face detection of use................................................
    faceVerify: (req, res) => {
        if (!req.body.faceUrl || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            email: req.body.email,
            status: "ACTIVE"
        }, {
            $set: {
                faceDetectionUrl: req.body.faceUrl
            }
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 401, "No result found.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    // pag2 ---> forgot password on sign in page
    userForgotpassword: (req, res) => {
        if (!req.body.passphrase || !req.body.newPassword) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }

        func.bcrypt(req.body.newPassword, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error1.")
            } else {
                console.log("result after bcr", result)
                User.findOneAndUpdate({
                    passphrase: req.body.passphrase,
                    status: "ACTIVE"
                }, {
                    $set: {
                        password: result
                    }
                }, {
                    new: true
                }, (err1, result1) => {
                    console.log("===========+>>>", err1, result1)
                    if (err1) {
                        return func.responseHandler(res, 400, "Internal server error2.", err1)
                    } else if (!result1) {
                        return func.responseHandler(res, 401, "Please provide valid passphrase.")
                    } else {
                        func.sendHtmlEmailOnFogotPassword(result1.email, "Anzen Wallet", req.body.location, req.body.deviceId, null, null, result1.userName, (errMail, emailOtp) => {
                            if (err) {
                                return func.responseHandler(res, 400, "Internal server error3.")
                            } else {
                                return func.responseHandler(res, 200, "Success.")
                            }
                        })
                    }
                })
            }
        })
    },
    //    page ---> 5 let's start with Anzen ...........................................
    twoFA: (req, res) => {
        if (!req.body.walletAddress || !req.body.otp || !req.body.deviceId || !req.body.location) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var obj = {
            deviceId: req.body.deviceId,
            signInTime: Date.now(),
            location: req.body.location,
            status: "signIn",
            signOutTime: 0
        }
        var obj1 = {
            $addToSet: {
                deviceId: req.body.deviceId
            },
            $push: {
                signInHistoryArray: {
                    $each: [obj],
                    $position: 0
                }
            },
            $set: {
                status: "ACTIVE"
            }
        }
        User.findOneAndUpdate({
            walletAddress: req.body.walletAddress,
            mobileOtp: req.body.otp
        }, obj1, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 401, "Invalid credentails.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    /* Page Number 5 in flinto api check a single word of passphrase*/
    twoFAByPassphrase: (req, res) => {
        if (!req.body.walletAddress || !req.body.passphrase || !req.body.passphraseNumber || !req.body.deviceId || !req.body.location) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var obj = {
            deviceId: req.body.deviceId,
            signInTime: Date.now(),
            location: req.body.location,
            status: "signIn",
            signOutTime: 0
        }
        var obj1 = {
            $addToSet: {
                deviceId: req.body.deviceId
            },
            $push: {
                signInHistoryArray: {
                    $each: [obj],
                    $position: 0
                }
            },
            $set: {
                status: "ACTIVE"
            }
        }
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "No result Found.")
            } else {
                var a = result.passphrase.split(' ')
                console.log("a===>>", a, a.indexOf(req.body.passphrase), req.body.passphraseNumber - 1)
                console.log("============>>>>", a.indexOf(req.body.passphrase))
                if (a.indexOf(req.body.passphrase) == req.body.passphraseNumber - 1) {
                    User.findOneAndUpdate({
                        walletAddress: req.body.walletAddress
                    }, obj1, (err_, result_) => {
                        if (err_) {
                            return func.responseHandler(res, 400, "Internal server error.")
                        } else {
                            return func.responseHandler(res, 200, "Success.")
                        }
                    })
                } else {
                    return func.responseHandler(res, 401, "Invalid Passphrase.")
                }
            }
        })
    },
    // addCustom token to get decimal and contract address....................................................................
    getDecimalsymbol: (req, res) => {
        if (!req.body.tokenAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }

        var url = "https://api.ethplorer.io/getTokenInfo/" + req.body.tokenAddress + "?apiKey=freekey";
        // var url = "https://ropsten.etherscan.io/getTokenInfo/" + req.body.tokenAddress + "?apiKey=freekey"
        func.nodeClient(url, (err, result) => {
           
             if (result.error) {
                return func.responseHandler(res, 400, result.error)
            } else {
                console.log("====>>>>", result)
                return func.responseHandler(res, 200, result)
            }
        })
    },
    // Dashboard section of add custom token or ERC token by user & Admin .....................................................
    addToken: (req, res) => {
        console.log("req.body===>", req.body)
        if (!req.body._id || !req.body.tokenAddress || !req.body.addedBy) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var abi = []
        var tokenAddress = req.body.tokenAddress
        var url = "https://api.ethplorer.io/getTokenInfo/" + tokenAddress + "?apiKey=freekey"
        // var url = "https://ropsten.etherscan.io/getTokenInfo/" + tokenAddress + "?apiKey=freekey"
        func.nodeClient(url, (err, result) => {
            console.log("result=====>>>", result)
            if (result.error) {
                return func.responseHandler(res, 400, result.error)
            } else {
                var abiurl = "https://api.etherscan.io/api?module=contract&action=getabi&address=" + tokenAddress
                // var abiurl = "https://ropsten.etherscan.io/api?module=contract&action=getabi&address=" + tokenAddress
                func.nodeClient(abiurl, (err, result1) => {
                    console.log("result====>>>>", result1)
                    if (err) {
                        return func.responseHandler(res, 400, "ERROR", err)
                    } else if (result1.status === '0') {
                        return func.responseHandler(res, 400, "Contract source code not verified", err)
                    } else {
                        // console.log("result111 ===>", result1)
                        if (req.body.addedBy === "USER") {
                            var obj = new tokenList({
                                tokenAddress: tokenAddress,
                                tokenDecimal: result.decimals,
                                tokenSymbol: result.symbol,
                                tokenName: result.name,
                                abi: result1.result,
                                createdBy: req.body._id,
                                addedBy: "USER",
                                action: "ACTIVE",
                                status: "DEACTIVE",
                                isAdmin:"FALSE"
                            })
                        }
                        if (req.body.addedBy === "ADMIN") {
                            var obj = new tokenList({
                                tokenAddress: tokenAddress,
                                tokenDecimal: result.decimals,
                                tokenSymbol: result.symbol,
                                tokenName: result.name,
                                abi: result1.result,
                                createdBy: req.body._id,
                                addedBy: "ADMIN",
                                action: "ACTIVE",
                                isAdmin:"TRUE",
                                walletAddress: req.body.walletAddress,
                                status: "ACTIVE"
                            })
                        }
                        tokenList.findOne({
                            tokenAddress: req.body.tokenAddress,
                            status: "ACCEPT"
                        }, (err, result) => {
                            // console.log("result 11111====>>", err,result)
                            if (err) {
                                return func.responseHandler(res, 400, "Internal server error.", err)
                            } else if (!result) {
                                console.log("successss")
                                obj.save((err, result) => {
                                    if (err) {
                                        return func.responseHandler(res, 400, "ERROR", err)
                                    } else {
                                        return func.responseHandler(res, 200, "Sucecess", )
                                    }
                                })
                            } else {
                                return func.responseHandler(res, 400, "Token is already added.", )
                            }
                        })
                    }
                })
            }
        })
    },
    // show token for individual user  **********************   only show added token by particular user .................................
    showToken: (req, res) => {
        console.log("@#$@#$@#$@#$@#$@#$@#$@#$")
        var myAddress = req.body.walletAddress
        var finalBalance;
        var finalArray = [];
        var actualPrice = 0;
        let m = req.body.limit || 10
        let n = req.body.page || 1
        if (!req.body.walletAddress || !req.body.userId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            walletAddress: req.body.walletAddress,
            status: "ACTIVE"
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid credentials.")
            } else {
                // console.log("result===>>", result)
                tokenList.find({
                    createdBy: req.body.userId
                }, (err_, result_) => {
                    if (err_) {
                        return func.responseHandler(res, 400, "Internal server error.")
                    } else {
                        // console.log("result ====>>", result_)
                        each(result_, (ele, next) => {
                            var obj = {}
                            // console.log("calllllll")
                            var abi = JSON.parse(ele.abi)
                            // console.log(" abi ===>>",abi)
                            var contract = new web3.eth.Contract(abi, ele.tokenAddress) //mainnet
                            // var contract = new web3.eth.Contract(abiArray, ele.tokenAddress) //testnet
                            // console.log("contract ===>>>",contract)
                            contract.methods.balanceOf(myAddress).call().then(balance => {
                                // console.log("=========>>>>", balance)
                                // console.log("=====>>>>", balance, ele.tokenDecimal)
                                var toNumber = Number(ele.tokenDecimal)
                                // console.log("to number===>>", toNumber)
                                var finalBalance = Number(new BigNumber(balance).dividedBy(new BigNumber(Math.pow(10, toNumber)))).toFixed(ele.tokenDecimal);
                                // console.log("===========>>>>", finalBalance)
                                //  finalBalance = web3.utils.toHex(finalBalance) 
                                // console.log("balance of " + ele.tokenName + "===>>>>", finalBalance)
                                // console.log("hiiiiiiiiii")
                                var getInfoUrl = "https://api.ethplorer.io/getTokenInfo/" + ele.tokenAddress + "?apiKey=freekey"
                                func.nodeClient(getInfoUrl, (err1, result1) => {
                                    // console.log("result for get token info =====>> ", result1)
                                    if (result1.err) {
                                        // console.log("Error in checking real balance of token  =====>> ", result.error)
                                    } else {

                                        console.log("result of real balance", result1.price)
                                        if (result1.price == false) {
                                            console.log("after get price in if ****************S")
                                            obj.tokenName = 0,
                                                obj.tokenBalance = finalBalance
                                            obj.tokenPrice = 0
                                            obj.amount = 0
                                            finalArray.push(obj)
                                            next();
                                        } else {
                                            url = "http://free.currencyconverterapi.com/api/v5/convert?q=USD_" + result.currency + "&compact=y"
                                            func.nodeClient(url, (err, result2) => {
                                                if (err) {
                                                    console.log("err=====>>", err)
                                                } else {
                                                    //  console.log("after get price in else &&&&&&&&&&&&&&&&&&&&&&")
                                                    //  console.log("***************",result2[("USD_"+result.currency)]["val"])
                                                    //  console.log("==================++>>>>>>",result1.price.rate,finalBalance)
                                                    //  console.log("*********************+>>>>>>",Number(new BigNumber(result1.price.rate).multipliedBy(new BigNumber(5).multipliedBy(new BigNumber(result2[("USD_"+result.currency)]["val"])))))
                                                    //  console.log(new BigNumber((Number(result1.price)).multipliedBy(new BigNumber(finalBalance))))
                                                    obj.tokenName = ele.tokenName,
                                                        obj.tokenBalance = finalBalance
                                                    obj.tokenPrice = result1.price.rate || 5
                                                    obj.amount = Number(new BigNumber(result1.price.rate).multipliedBy(new BigNumber(5).multipliedBy(new BigNumber(result2[("USD_" + result.currency)]["val"]))))
                                                    finalArray.push(obj)
                                                    next();
                                                }
                                            })
                                        }
                                    }
                                })

                            }).catch(err => {
                                //    console.log("Error in checking balance.",err)
                                return func.responseHandler(res, 400, "Returned values aren't valid.", )

                            })
                            // next();
                        }, (err) => {
                            if (err) {
                                console.log("err====>>>", err)
                            } else {
                                console.log("final Array===>>", finalArray)
                                // return;
                                var finalArray1 = finalArray.slice((n - 1) * m, n * m)
                                let final = {
                                    data: finalArray1,
                                    page: n,
                                    limit: m,
                                    total: finalArray.length,
                                    pages: Math.ceil(finalArray.length / m)
                                }
                                return func.responseHandler(res, 200, "Success2.", final)
                            }
                        })
                    }
                })

            }
        })
    },
    //  show token when user search ..........................................................................................
    userSearchToken: (req, res) => {
        if (!req.body.tokenName) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        let options = {
            page: req.body.page || 1,
            limit: 10,
            select: 'tokenAddress tokenDecimal tokenName -_id'
        }
        var query = {
            tokenName: {
                $regex: new RegExp(req.body.tokenName, "ig")
            }
        }
        tokenList.paginate(query, options, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result.length == 0) {
                return func.responseHandler(res, 404, "No Result Found.")
            } else {
                return func.responseHandler(res, 200, "Success.", result)
            }
        })
    },
    //  this api using custom pagination show transactin history ..............................................................
    walletHistory: (req, res) => {
        var walletAddress = req.body.walletAddress.toLowerCase()
        // console.log("======>>>",walletAddress)
        if (!req.body.walletAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        // custom pagination..........................
        let m = req.body.limit || 10
        let n = req.body.page || 1
        var finalArray = [];
        var historyUrl = "http://api-ropsten.etherscan.io/api?module=account&action=txlist&address=" + walletAddress + "&sort=asc"
        func.nodeClient(historyUrl, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else {
                if (!req.body.status || req.body.status == undefined || req.body.status == null || req.body.status == "all") {
                    var finalArray1 = result.result.slice((n - 1) * m, n * m)
                    let final = {
                        data: finalArray1,
                        page: n,
                        limit: m,
                        total: result.result.length,
                        pages: Math.ceil(result.result.length / m)
                    }
                    return func.responseHandler(res, 200, "Success.", final)
                } else if (req.body.status === "sent") {
                    each(result.result, (ele, next) => {
                        // console.log("in sent user",ele.from,walletAddress ,ele.from == walletAddress)
                        if (ele.from == walletAddress) {
                            finalArray.push(ele)
                            // console.log("final array ===>>", finalArray)
                        }
                        next();
                    }, (err) => {
                        if (err) {
                            throw err;
                        }
                        var finalArray1 = finalArray.slice((n - 1) * m, n * m)
                        let final = {
                            data: finalArray1,
                            page: n,
                            limit: m,
                            total: finalArray.length,
                            pages: Math.ceil(finalArray.length / m)
                        }
                        return func.responseHandler(res, 200, "Success.", final)
                    })

                } else if (req.body.status == "receive") {
                    console.log("in receive")
                    each(result.result, (ele, next) => {
                        // console.log("in receive user",ele.to,walletAddress ,ele.to == walletAddress)
                        if (ele.to == walletAddress) {
                            finalArray.push(ele)
                            // console.log("ele", ele)
                        }
                        next();
                    }, (err) => {
                        if (err) {
                            throw err
                        }
                        var finalArray1 = finalArray.slice((n - 1) * m, n * m)
                        let final = {
                            data: finalArray1,
                            page: n,
                            limit: m,
                            total: finalArray.length,
                            pages: Math.ceil(finalArray.length / m)
                        }
                        return func.responseHandler(res, 200, "Success1.", final)
                    })
                }
            }
        })
    },
    //  change currencny...........................................................................
    changeCurrency: (req, res) => {
        if (!req.body.walletAddress || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOneAndUpdate({
            email: req.body.email,
            walletAddress: req.body.walletAddress
        }, {
            $set: {
                currency: req.body.currency
            }
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    // Term of use api for dash board
    termOfUse: (req, res) => {
        staticContent.find({}, {
            termsOfUse: 1,
            _id: 0
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result.length == 0) {
                return func.responseHandler(res, 404, "No Result Found.")
            } else {
                return func.responseHandler(res, 200, "Success.", result)
            }
        })
    },
    // Term of use api for dash board
    faq: (req, res) => {
        let m = req.body.limit || 10
        let n = req.body.page || 1
        staticContent.find({}, {
            faq: 1,
            _id: 0
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else if (result.length == 0) {
                return func.responseHandler(res, 404, "No Result Found.")
            } else {
                console.log("@@@@@+==>>" + JSON.stringify(result[0].faq))
                var result1 = result[0].faq.slice((n - 1) * m, n * m)
                let final = {
                    data: result1,
                    page: n,
                    limit: m,
                    total: result[0].faq.length,
                    pages: Math.ceil(result[0].faq.length / m)
                }
                return func.responseHandler(res, 200, "Success.", final)
            }
        })
    },
    // page 7 when user login to some new devices.................................................
    updateEmailOrPhone: (req, res) => {
        if (!req.body.walletAddress || !req.body.mobileNumber || !req.body.email) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            } else {
                var mobileOtp = Math.floor(100000 + Math.random() * 900000)
                func.sendMessageNexmo(req.body.mobileNumber, mobileOtp, (errOtp, mobileOtp) => {
                    if (errOtp) {
                        return func.responseHandler(res, 400, "Internal server error.", errOtp)
                    } else {
                        console.log("MobileOTP ====>>>", mobileOtp)
                        var random = Math.floor(100000 + Math.random() * 900000)
                        console.log("random====>>", random)
                        func.sendHtmlEmailForPassword(req.body.email, "Anzen Wallet", null, "" + "<b> <h3 > <h3> <b>" + random, null, null, result.userName, (errMail, emailOtp) => {
                            console.log("Email OTP ====>>>>", errMail, emailOtp)
                            if (errMail) {
                                return func.responseHandler(res, 400, "Internal server error.", errMail)
                            } else {
                                User.findOneAndUpdate({
                                    walletAddress: req.body.walletAddress
                                }, {
                                    $set: {
                                        emailOtp: random,
                                        mobileOtp: mobileOtp
                                    }
                                }, {
                                    new: true
                                }, (err_, result_) => {
                                    if (err_) {
                                        return func.responseHandler(res, 400, "Internal server error.", err_)
                                    } else {
                                        return func.responseHandler(res, 200, "Success.", result_)
                                    }
                                })

                            }
                        })
                    }
                })

            }
        })
    },
    // page Number 10 .........................................................................................................................
    inputValidateCode: (req, res) => {
        if (!req.body.emailOtp || !req.body.mobileOtp || !req.body.walletAddress || !req.body.email || !req.body.mobileNumber) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var query = {
            walletAddress: req.body.walletAddress,
            emailOtp: req.body.emailOtp,
            mobileOtp: req.body.mobileOtp
        }
        var obj1 = {
            $set: {
                email: req.body.email,
                mobileNumber: req.body.mobileNumber
            }
        }
        User.findOneAndUpdate(query, obj1, {
            new: true
        }, (err, result) => {
            console.log("err,result", err, result)
            if (err) {
                // console.log("result===>>>>".result)
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (result) {
                console.log("result===>>>>".result)
                return func.responseHandler(res, 200, "Success.")
            } else {
                return func.responseHandler(res, 401, "Inavalid OTP.")
            }
        })
    },

    //  logout api user to save logout history ....................................................
    logout: (req, res) => {
        if (!req.body.walletAddress || !req.body.email || !req.body.deviceId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        let date = Date.now();
        date = date.toString();
        console.log("************", date);
        var query = {
            walletAddress: req.body.walletAddress,
            "signInHistoryArray.status": "signIn"
        }
        var obj = {
            $set: {
                "signInHistoryArray.$.status": "signOut",
                "signInHistoryArray.$.signOutTime": Date.now()
            },
        }
        User.findOneAndUpdate(query, obj, {
            new: true
        }, (err, result) => {
            console.log("@@@@@@@@@@@@@", err, result);
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid Credentials.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    /*=====================================================================================================================================================/
     /                                                                         WEBSITE API                                                                 /
     /=====================================================================================================================================================*/
    // change status of device by website ...........then never signin with this device..................
    changeStatusOfDevice: (req, res) => {
        if (!req.body.walletAddress || !req.body.passphrase || !req.body.passphraseNumber || !req.body.status || !req.body.deviceObj_id || !req.body.deviceId) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            console.log("result==>>", result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 400, "Invalid Credentials.")
            } else {
                console.log("result=====>>", result)
                var a = result.passphrase.split(' ')
                console.log("a===>>", a, a.indexOf(req.body.passphrase), req.body.passphraseNumber - 1)
                console.log("============>>>>", a.indexOf(req.body.passphrase), req.body.passphraseNumber - 1)
                if (a.indexOf(req.body.passphrase) == req.body.passphraseNumber - 1) {
                    if (req.body.status == "DEACTIVE") {
                        User.findOneAndUpdate({
                            walletAddress: req.body.walletAddress,
                            'signInHistoryArray._id': req.body.deviceObj_id || !req.body.deviceId
                        }, {
                            $set: {
                                'signInHistoryArray.$.deviceStatus': req.body.status
                            },
                            $addToSet: {
                                blockedDevices: req.body.deviceId
                            }
                        }, {
                            new: true
                        }, (err1, result1) => {
                            console.log("signINHistory arary===>>", err1, result1)
                            if (err1) {
                                return func.responseHandler(res, 400, "Internal server error.")
                            } else if (!result1) {
                                return func.responseHandler(res, 400, "Invalid device Id.")
                            } else {
                                return func.responseHandler(res, 200, "Success.")
                            }
                        })
                    } else {
                        User.findOneAndUpdate({
                            walletAddress: req.body.walletAddress,
                            'signInHistoryArray._id': req.body.deviceObj_id || !req.body.deviceId
                        }, {
                            $set: {
                                'signInHistoryArray.$.deviceStatus': req.body.status
                            },
                            $pull: {
                                blockedDevices: req.body.deviceId
                            }
                        }, {
                            new: true
                        }, (err1, result1) => {
                            console.log("signINHistory arary===>>", err1, result1)
                            if (err1) {
                                return func.responseHandler(res, 400, "Internal server error.")
                            } else if (!result1) {
                                return func.responseHandler(res, 400, "Invalid device Id.")
                            } else {
                                return func.responseHandler(res, 200, "Success.")
                            }
                        })
                    }

                } else {
                    return func.responseHandler(res, 400, "Invalid Passphrase.")
                }

            }
        })

    },

    /*=====================================================================================================================================================/
    /                                                         Ethereum Section Api                                                                         /
    /=====================================================================================================================================================*/
    //  send Ethereum to any other wallet ...................or to any other user....................................................................
    sendEthereum: (req, res) => {
        if (!req.body.toAddress || !req.body.walletAddress || !req.body.amount) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        // check user present in Database and also get private Key .........................
        User.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "Inavalid Credentials.")
            } else {
                // Decrypt the Private Key of User .........................
                func.cryptVerify(result.privateKey, (errCry, resultCry) => {
                    if (errCry) {
                        return func.responseHandler(res, 404, "Inavalid PrivateKey.")
                    } else {
                        var toAddr = req.body.toAddress
                        var fromAddr = req.body.walletAddress
                        var value = req.body.amount
                        ethereum.sendEther(toAddr, fromAddr, value, resultCry, (err1, result1) => {
                            // console.log("Error or result===>>>>", err1, result1)
                            if (err1) {
                                return func.responseHandler(res, 400, "Internal server error.")
                            } else {
                                return func.responseHandler(res, 200, "Success.", result1)
                            }
                        })
                    }
                })

            }
        })
    },

    /*=====================================================================================================================================================/
    /                                                          Admin panel section api                                                                    /
    /=====================================================================================================================================================*/

    showTokenAdmin: (req, res) => {
        let options = {
            page: req.body.page || 1,
            limit: req.body.limit || 10,
            select: 'addedBy tokenName action status tokenAddress createdBy isAdmin'
        }
        if (!req.body._id) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        // run when Admin get token list
        let query = {
            _id: req.body._id,

        };
        let query2 = {
            addedBy: "ADMIN",
            // status:{$ne:"BLOCK"}
        };
        if (req.body.userType)
            query2.addedBy = req.body.userType;
        if (req.body.search) {
            query2.$or = [{
                 tokenName: {
                    $regex: req.body.search,
                    $options: "i"
                }
            }]
        }
        console.log("query", query)
        admin.findOne(query, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.", err)
            } else if (!result) {
                return func.responseHandler(res, 404, "Invalid credentials.")
            } else {
                console.log("query2===>>",query2)
                tokenList.paginate(query2, options, (err_, result_) => {
                    if (err_) {
                        return func.responseHandler(res, 400, "Internal server error.", err_)
                    } else if (result.length < 1) {
                        return func.responseHandler(res, 404, "No Data Found.")
                    } else {
                        console.log("result is --->>",result_)
                        return func.responseHandler(res, 200, "Success.", result_)
                    }
                })
            }
        })
    },
    // Accept and reject request of Users............................................................
    changeStatusOfTokenOfUserToken: (req, res) => {
        console.log("changeStatusOfTokenOfUserTokenchangeStatusOfTokenOfUserTokenchangeStatusOfTokenOfUserToken",req.body)
        if (!req.body.tokenAddress || !req.body.status || !req.body.createdBy) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        if (req.body.status == "ACCEPT") {
            update = {
                $set: {
                    // action: req.body.status,
                    status: "ACTIVE",
                    addedBy:"ADMIN"
                }
            }
        } else if (req.body.status == "REJECT") {
            update = {
                $set: {
                    // status: req.body.status,
                    status: "BLOCK"
                }
            }
        }
        console.log("----updateupdateupdate----->>>",update)
        tokenList.findOneAndUpdate({
            tokenAddress: req.body.tokenAddress,
            createdBy: req.body.createdBy
        }, update, {
            new: true
        }, (err, result) => {
            // console.log("result for testing --->>", result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "No Token Found.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },

    // changeStatus Of Token from admin panel ........................................................
    changeStatusOfToken: (req, res) => {

        // console.log('changestatus of tokenanurag ',req.body)
/*         if (!req.body.tokenAddress || !req.body.status) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }

        if (req.body.status == "ACCEPT") {
            update = {
                $set: {
                    action: req.body.status,
                    status: "ACCEPT"
                }
            }
        } else if (req.body.status == "REJECT") {
            update = {
                $set: {
                    action: req.body.status,
                    status: "REJECT"
                }
            }
        } */
        console.log("status",req.body.status)
        tokenList.findOneAndUpdate({
            tokenAddress: req.body.tokenAddress
        }, {
            $set: {
                    status: req.body.status
            }
        }, {
            new: true
        }, (err, result) => {
            // console.log("result for testing --->>", result)
            if (err) {
                return func.responseHandler(res, 400, "Internal server error.")
            } else if (!result) {
                return func.responseHandler(res, 404, "No Token Found.")
            } else {
                return func.responseHandler(res, 200, "Success.")
            }
        })
    },
    /*=====================================================================================================================================================/
/                                                        All testing Apis                                                                           /
/==================================================================================================================================================*/
    test: (req, res) => {
        func.crypt("0xBF178219BB16010ECB58092D941205805FC3DA6DAC240857E435E7FAB7C20E16", (err, result) => {
            console.log("==========+>>>>>", err, result)
        })

    },
}