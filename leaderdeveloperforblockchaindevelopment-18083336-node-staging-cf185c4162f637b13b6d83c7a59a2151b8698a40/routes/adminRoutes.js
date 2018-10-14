let adminRoutes = require('express').Router()
let adminHandler = require('../fileHandler/adminHandler.js')
let Auth_fuct = require('../fileHandler/TOKEN')

adminRoutes.post('/login', adminHandler.login);
adminRoutes.post('/forgot', adminHandler.forgot);
adminRoutes.get('/getProfile', adminHandler.getProfile);
adminRoutes.post('/updateProfile', adminHandler.updateProfile);
adminRoutes.post('/changePassword', adminHandler.changePassword);
adminRoutes.post('/resetPassword/:otp/:adminId', adminHandler.resetPassword);
adminRoutes.post('/logout', adminHandler.logout);
adminRoutes.post('/addAnnouncement', adminHandler.addAnnouncement);
adminRoutes.post('/editAnnouncement', adminHandler.editAnnouncement);
adminRoutes.get('/getAllAnnouncement', adminHandler.getAllAnnouncement);
adminRoutes.post('/announcementInfo', adminHandler.announcementInfo);
adminRoutes.post('/deleteAnnouncement', adminHandler.deleteAnnouncement);
adminRoutes.post('/removeUser', adminHandler.removeUser);
adminRoutes.post('/editUser', adminHandler.editUser);
adminRoutes.post('/deleteUser', adminHandler.deleteUser);
adminRoutes.post('/commision', adminHandler.commision);
adminRoutes.post('/getUserList', adminHandler.getUserList);
adminRoutes.post('/getUserListNew', adminHandler.getUserListNew);
adminRoutes.post('/changeStatus', adminHandler.changeStatus);
adminRoutes.get('/countUser', adminHandler.countUser);
adminRoutes.post('/getUserInfo', adminHandler.getUserInfo);
adminRoutes.get('/countAnnouncement', adminHandler.countAnnouncement);
adminRoutes.post('/userTransactionHistory', adminHandler.userTransactionHistory);
adminRoutes.post('/userDeviceHistory/:walletAddress', adminHandler.userDeviceHistory);
adminRoutes.post('/getAnnouncementUserList', adminHandler.getAnnouncementUserList);



module.exports = adminRoutes;