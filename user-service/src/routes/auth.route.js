const express= require('express');
const router = express.Router();
const {sendOTP, verifyOTP,login,rotaterefreshtoken} = require('../controllers/auth.controller')
const {getUserContext}=require('../middlewares/getUserContext.middleware')

router.post("/send-otp",sendOTP);
router.post('/verify-otp', verifyOTP);
router.post("/login",login);
router.get("/refresh",rotaterefreshtoken)

module.exports=router;