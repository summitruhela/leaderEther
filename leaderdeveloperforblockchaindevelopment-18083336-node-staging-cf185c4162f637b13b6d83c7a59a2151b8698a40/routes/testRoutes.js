let testRoutes=require('express').Router()
let testHandler=require('../fileHandler/test.js')

testRoutes.post('/addToken',testHandler.addToken);
testRoutes.post('/checkBalance',testHandler.checkBalance);
testRoutes.post('/sendToken',testHandler.sendToken);

module.exports=testRoutes;