const router = require('express').Router();
const static = require('../fileHandler/staticContentHandeler');
let Auth_fuct = require('../fileHandler/TOKEN')

router.post('/updateStatic',Auth_fuct.verifyToken,static.updateStatic);
router.get('/getStaticContent',Auth_fuct.verifyToken,static.getStaticContent);
router.post('/getAllFaq',Auth_fuct.verifyToken,static.getAllFaq);
router.post('/deleteFaq',Auth_fuct.verifyToken,static.deleteFaq);
router.post('/hideFaq',Auth_fuct.verifyToken,static.hideFaq);
router.get('/getFaq/:faqId',Auth_fuct.verifyToken,static.getFaq);
router.post('/editFaq',Auth_fuct.verifyToken,static.editFaq);

// router.post('/updateStatic',static.updateStatic);
// router.get('/getStaticContent',static.getStaticContent);
// router.post('/getAllFaq',static.getAllFaq);
// router.post('/deleteFaq',static.deleteFaq);
// router.post('/hideFaq',static.hideFaq);
// router.get('/getFaq/:faqId',static.getFaq);
// router.post('/editFaq',static.editFaq);

module.exports = router;