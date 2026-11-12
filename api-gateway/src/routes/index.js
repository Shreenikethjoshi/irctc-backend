const express=require('express');
const {requireAuth} = require('../middlewares/auth.middleware');
const {ipRateLimit,endpointRateLimit,combinedRateLimit}=require('../middlewares/rateLimiting.middleware')
const {config}=require('../config');
const {createProxy}=require('../services/proxy')

const router = express.Router();

const userServiceProxy = createProxy('userService',config.SERVICES.USER_SERVICE_URL);

router.post(
    '/users/auth/login',
    endpointRateLimit(10,900000), // 10 req per 15 mins
    userServiceProxy
)
router.post(
    '/users/auth/send-otp',
    endpointRateLimit(5, 3600000),
    userServiceProxy
)
router.post('/users/auth/verify-otp', userServiceProxy)
router.get('/users/auth/refresh', userServiceProxy)
// private route
router.get(
    '/users/user/profile',
    requireAuth,
    combinedRateLimit(),
    userServiceProxy
)


//gateway health
router.get('/gateway-heath',(req,res)=>{
    res.status(200).json({
        success:true,
        message:"API gateway is healthy",
        timestamp: new Date().toString()
    })
})

module.exports=router;