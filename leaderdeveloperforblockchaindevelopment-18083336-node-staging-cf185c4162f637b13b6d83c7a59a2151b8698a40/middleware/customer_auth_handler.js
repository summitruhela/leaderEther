const jwt = require('jsonwebtoken');
// const config = require('../config/config')();
const config = require('../config/config.dev');
const Response = require('../commonFile/response_handler');
const resCode = require('../helper/httpResponseCode');
const resMessage = require('../helper/httpResponseMessage');
const registration = require('../dbSchema/adminModel/loginModel')
const auth = {
    verifyToken: (req, res, next) => {
        // var token =  req.headers.token ;
        console.log("header>>>>>>>" + req.headers._id + "  token is >>>>>>" + req.headers.token)
        if (req.headers.token) {
            console.log("secret key is " + config.secret)
            jwt.verify(req.headers.token, config.secret, (err, result) => {
                if (err) {
                    console.log("token not verified", err)
                    Response.sendResponseWithoutData(res, resCode.UNAUTHORIZED, "Authentication failed.")
                }

                
                else {
                    console.log("token verified")
                    console.log(result)
                    registration.findOne({ token: req.headers.token }, (error, result) => {
                        console.log("result of user " + JSON.stringify(result))
                        if (error)
                            Response.sendResponseWithoutData(res, resCode.WENT_WRONG, resMessage.WENT_WRONG)
                        else if (!result) {
                            console.log("null user entered")
                            // console.log(decoded)
                            Response.sendResponseWithoutData(res, resCode.FORBIDDEN, "User not found.|| token is expired")
                        }
                        else {
                            next();
                            //Response.sendResponseWithData(res,resCode.EVERYTHING_IS_OK,"Verify_Successfully",result)
                        }
                    })
                }
            })
        } else {
            Response.sendResponseWithoutData(res, 403, "No token provided.")
        }
    }
};
// verifyToken: (req, res, next) => {
//     console.log("req.headers.token-=========>>>>", req.headers.token)
//     if (req.headers.token == "null" || req.headers.token == "" || req.headers.token == "undefined" || req.headers.token == null || req.headers.token == undefined) {
//         console.log("token not verified",err)
//          Response.sendResponseWithoutData(res, resCode.UNAUTHORIZED, "Authentication failed.")
//     }
//     jwt.verify(req.headers.token, config.Secret_Key, (err, decoded) => {
//     console.log("verify token", decoded)
//     if (err) {
//         Response.sendResponseWithoutData(res, resCode.WENT_WRONG, resMessage.WENT_WRONG)
//     } else {
//     next();
//     }
//     })
//     }
// };

module.exports = auth;