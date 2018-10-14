let userRoutes=require('express').Router()
let userHandler=require('../fileHandler/userHandler.js')
let func=require('../fileHandler/function.js')

userRoutes.post('/signUp',userHandler.signUp);
userRoutes.post('/inputCodeVerfication',func.jwtVerify,userHandler.inputCodeVerfication);
userRoutes.post('/resendEmailOtp',func.jwtVerify,userHandler.resendEmailOtp);
userRoutes.post('/resendMobileOtp',func.jwtVerify,userHandler.resendMobileOtp);
userRoutes.post('/enableFingerPrintTouch',func.jwtVerify,userHandler.enableFingerPrintTouch);
userRoutes.post('/enableFaceDetection',func.jwtVerify,userHandler.enableFaceDetection);
userRoutes.post('/accountDetails',func.jwtVerify,userHandler.accountDetails);
userRoutes.post('/accoutnDetailsSendOtp',func.jwtVerify,userHandler.accoutnDetailsSendOtp);
userRoutes.post('/accountDetailsSaveChanges',userHandler.accountDetailsSaveChanges);
userRoutes.post('/Askquery',func.jwtVerify,userHandler.Askquery);
userRoutes.post('/SigninHistory',userHandler.SigninHistory);
userRoutes.post('/signin',userHandler.signin);
userRoutes.post('/userForgotpassword',userHandler.userForgotpassword);
userRoutes.post('/twoFA',func.jwtVerify,userHandler.twoFA);
userRoutes.post('/getDecimalsymbol',userHandler.getDecimalsymbol);
userRoutes.post('/addToken',userHandler.addToken);
userRoutes.post('/twoFAByPassphrase',func.jwtVerify,userHandler.twoFAByPassphrase);
userRoutes.post('/showToken',userHandler.showToken);
userRoutes.post('/walletHistory',userHandler.walletHistory);
userRoutes.post('/changeCurrency',func.jwtVerify,userHandler.changeCurrency);
userRoutes.post('/fingerPrintVerify',func.jwtVerify,userHandler.fingerPrintVerify);
userRoutes.post('/faceVerify',func.jwtVerify,userHandler.faceVerify);
userRoutes.post('/logout',func.jwtVerify,userHandler.logout);
userRoutes.post('/userSearchToken',func.jwtVerify,userHandler.userSearchToken);
userRoutes.get('/termOfUse',func.jwtVerify,userHandler.termOfUse);
userRoutes.get('/faq',func.jwtVerify,userHandler.faq);
userRoutes.post('/sendEthereum',userHandler.sendEthereum);
userRoutes.post('/showTokenAdmin',userHandler.showTokenAdmin);//get _id in params
userRoutes.post('/updateEmailOrPhone',func.jwtVerify,userHandler.updateEmailOrPhone);
userRoutes.post('/inputValidateCode',func.jwtVerify,userHandler.inputValidateCode);
userRoutes.post('/changePassword',func.jwtVerify,userHandler.changePassword);
userRoutes.post('/changeStatusOfDevice',userHandler.changeStatusOfDevice);
userRoutes.post('/changeStatusOfToken',userHandler.changeStatusOfToken);
userRoutes.post('/changeStatusOfTokenOfUserToken',userHandler.changeStatusOfTokenOfUserToken);




userRoutes.post('/test',userHandler.test);





module.exports=userRoutes;