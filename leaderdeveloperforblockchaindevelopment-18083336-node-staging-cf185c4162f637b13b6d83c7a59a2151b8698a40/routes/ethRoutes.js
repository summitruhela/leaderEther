let ethRoutes=require('express').Router()
let ethHandler=require('../fileHandler/eth.js')

ethRoutes.post('/sendToken',ethHandler.sendToken);
ethRoutes.post('/test',ethHandler.test);
ethRoutes.post('/test1',ethHandler.test1);
ethRoutes.post('/test2',ethHandler.test2);
ethRoutes.post('/get_transfer',ethHandler.get_transfer);

module.exports=ethRoutes;