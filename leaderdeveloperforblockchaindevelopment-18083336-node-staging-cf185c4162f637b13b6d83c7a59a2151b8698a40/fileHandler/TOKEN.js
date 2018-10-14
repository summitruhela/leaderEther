
var jwt = require('jsonwebtoken');
var config = require("../config/config")
let func = require('../fileHandler/function.js');
const mongoose = require('mongoose')
let admin = require('../models/admin.js')

module.exports = {




    verifyToken: (req, res, next) => {
        if (!req.headers.token)
            return func.responseHandler(res, 810, "Provide token");
        else {
            jwt.verify(req.headers.token, config.secret.secret_key, (err, success) => {
                if (err)
                    return func.responseHandler(res, 400, "err",err);
                else if (!success)
                    return func.responseHandler(res, 846, "Provide valid token");
                else {
                    admin.findOne({ email: success.email }, (err, success1) => {
                        if (err)
                            return func.responseHandler(res, 841, "err");
                        else if (!success)
                            return func.responseHandler(res, 845, "user not exists");
                        else {
                            next()
                        }

                    })
                }
            });
        }
    }
}