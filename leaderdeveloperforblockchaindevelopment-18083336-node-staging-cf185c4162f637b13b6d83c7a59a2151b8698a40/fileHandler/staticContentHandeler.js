const StaticContent = require('../models/staticContentModel');
const Fees = require('../models/commisionModel');
let func = require('../fileHandler/function.js')
var mongoose = require('mongoose');
var paginate = require('mongoose-paginate');
let User = require('../models/user.js');
const Response = require('../commonFile/response_handler.js')

const staticApi = {

    'updateStatic': (req, res) => {
        if (!req.body)
            func.responseHandler(res, 401, "Parameters missing.")

        else if (req.body.faq && !req.body.termsOfUse) {
            StaticContent.findOneAndUpdate({}, { $push: { "faq": { "Ques": req.body.faq.Ques, "Ans": req.body.faq.Ans } } }, { new: true },
                (error, result) => {
                    if (error)
                        func.responseHandler(res, 400, "Internal server error.")
                    else if (!result)
                        func.responseHandler(res, 401, "This id does not exist.")
                    else
                        return func.responseHandler(res, 200, "Content data upload successfully.", result)
                })
        }
        else if (req.body.termsOfUse && !req.body.faq) {
            StaticContent.findOneAndUpdate({}, { $set: { "termsOfUse": req.body.termsOfUse } }, { new: true },
                (error, result) => {
                    if (error)
                        func.responseHandler(res, 400, "Internal server error.")
                    else if (!result)
                        func.responseHandler(res, 401, "This id does not exist.")
                    else
                        return func.responseHandler(res, 200, "Content data upload successfully.", result)
                })
        }
        else if (req.body.faq && req.body.termsOfUse) {
            StaticContent.findOneAndUpdate({}, { $push: { "faq": { "Ques": req.body.faq.Ques, "Ans": req.body.faq.Ans } } }, { new: true }, (error, result) => {
                if (error)
                    func.responseHandler(res, 400, "Internal server error.")
                else if (!result)
                    func.responseHandler(res, 401, "This id does not exist.")
                else {
                    StaticContent.findOneAndUpdate({}, { $set: { "termsOfUse": req.body.termsOfUse } }, { new: true }, (error, result) => {
                        if (error)
                            func.responseHandler(res, 400, "Internal server error.")
                        else if (!result)
                            func.responseHandler(res, 401, "This id does not exist.")
                        else
                            return func.responseHandler(res, 200, "Content data upload successfully.", result)
                    })
                }
            })
        }
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'getStaticContent': (req, res) => {
        StaticContent.findOne({}, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (result.length == 0)
                func.responseHandler(res, 401, "No static content found")
            else
                return func.responseHandler(res, 200, "Static content found successfully.", result)
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'getAllFaq': (req, res) => {

        StaticContent.findOne({}, { faq: 1 }).lean().exec((error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.")
            else if (result.length == 0)
                func.responseHandler(res, 401, "No FAQ found")
            else if (result) {
                var userList = result.faq;
                console.log("result.faq", userList);
                let pageNumber = req.body.pageNumber == 1 ? 1 : req.body.pageNumber;
                let maxResult = (req.body.limit ? req.body.limit : 4)
                let start = (pageNumber * maxResult) - maxResult;
                let end = pageNumber * maxResult;
                let totalPage = Math.ceil(userList.length);
                let pages = Math.ceil(totalPage / maxResult);
                console.log("totalPage", totalPage)
                var dataList = userList.slice(start, end);
                var final = {
                    dataList: dataList,
                    total: totalPage,
                    limit: maxResult,
                    page: req.body.pageNumber,
                    pages: pages
                }
                return func.responseHandler(res, 200, "All FAQ found successfully.", final)
            }
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    'getFaq': (req, res) => {
        StaticContent.findOne({ "faq._id": req.params.faqId }, "faq.$", (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.", error)
            else if (!result)
                func.responseHandler(res, 401, "This id does not exist.")
            else if (result)
                return func.responseHandler(res, 200, "FAQ found successfully.", result)
        });
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'editFaq': (req, res) => {
        StaticContent.findOneAndUpdate({ "faq._id": req.body.faqId }, { $set: { "faq.$.Ques": req.body.Ques, "faq.$.Ans": req.body.Ans } }, { new: true }, (error, result) => {
            if (error)
                func.responseHandler(res, 400, "Internal server error.", error)
            else if (!result)
                func.responseHandler(res, 401, "This id does not exist.")
            else if (result)
                return func.responseHandler(res, 200, "FAQ edited successfully.")
        });
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'deleteFaq': (req, res) => {
        StaticContent.find({}, (error1, result1) => {
            if (error1)
                func.responseHandler(res, 400, "Internal server error.")
            else if (result1.length == 0)
                func.responseHandler(res, 401, "No FAQ found")
            else if (result1) {
                StaticContent.findOneAndUpdate({ "faq._id": req.body._id }, { $pull: { "faq": { _id: req.body._id } } }, { new: true }, (error, result) => {
                    if (error)
                        func.responseHandler(res, 400, "Internal server error.")
                    else if (!result)
                        func.responseHandler(res, 401, "This id does not exist.")
                    else if (result)
                        return func.responseHandler(res, 200, "FAQ deleted successfully.", result)
                });
            }
        })
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    'hideFaq': (req, res) => {
        StaticContent.find({}, (error1, result1) => {
            if (error1)
                func.responseHandler(res, 400, "Internal server error.")
            else if (result1.length == 0)
                func.responseHandler(res, 401, "No FAQ found.")
            else if (result1) {
                StaticContent.update({ "faq._id": req.body._id }, { $set: { "faq.$.status": "INACTIVE" } }, (error, result) => {
                    if (error) {
                        console.log("hello")
                        func.responseHandler(res, 400, "Internal server error.")
                    }
                    else if (!result)
                        func.responseHandler(res, 401, "This id does not exist.")
                    else if (result)
                        return func.responseHandler(res, 200, "FAQ hidden successfully", result)
                });
            }
        })
    },

}
module.exports = staticApi;