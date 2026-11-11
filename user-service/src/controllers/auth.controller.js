const { BadRequestError, UnauthorizedError } = require("../utils/error");
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service')
const { config } = require('../config');
const getDeviceFingerprint = require("../utils/deviceFingerprint")


exports.sendOTP = asyncHandler(async(req,res)=>{
    const {firstName,lastName,email,password,confirmPassword}=req.body;
    if(!firstName || !lastName || !email || !password || !confirmPassword){
        throw new BadRequestError("All fields are mandatory");
    }
    if(password!==confirmPassword) {
        throw new BadRequestError("password mismatch");
    }
    const {otpSessionId}=await authService.sendOTP(firstName,lastName,email,password);
    res.cookie("otp_session",otpSessionId,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.OTP_TTL * 1000
    }).status(200).json({
        success:true,
        message: "OTP sent successfully"
    })
})




exports.verifyOTP=asyncHandler(async(req,res)=>{
    const {otp}=req.body;
    const otpSessionId = req.cookies.otp_session;
    if(!otp || !otpSessionId){
        throw new BadRequestError("OTP or OTP session is missing")
    }
    const user = await authService.verifyOTP(otp,otpSessionId);
    return res.status(201).json({
        success:true,
        message:"User Account created successfully",
        data:user
    })
})



exports.login = asyncHandler(async(req , res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        throw new BadRequestError("Email and password are required")
    }
    const deviceId=getDeviceFingerprint(req);
    const {accessToken,refreshToken,loggedInUser} = await authService.login(email,password,deviceId);
    res.cookie("refreshToken", refreshToken, {
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.REFRESH_TOKEN_EXP_SEC * 1000
    })
    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.ACCESS_TOKEN_EXP_SEC * 1000
    }).status(200).json({
        success:true,
        message:"logged in successfully",
        loggedInUser
    })
})



exports.rotaterefreshtoken = asyncHandler(async(req,res)=>{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
        throw new UnauthorizedError("Refreshh token is missing","Login again"); 
    }
    const deviceId=getDeviceFingerprint(req);
    const {newaccessToken,newrefreshToken} = await authService.rotateRefreshToken(refreshToken,deviceId);
    res.cookie("accessToken",newaccessToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.ACCESS_TOKEN_EXP_SEC*1000
    })
    res.cookie("refreshToken",newrefreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.REFRESH_TOKEN_EXP_SEC*1000
    }).status(200).json({
        success:true,
        message:"Access and Refresh token reissued"
    })
})


exports.verifyGoogleIdToken = asyncHandler(async(req, res) =>{
     const {idToken} = req.body;
     if(!idToken){
          throw new BadRequestError("Invalid Google ID Token", "INVALID TOKEN")
     }

     const deviceId = getDeviceFingerprint(req);
     
     const {accessToken, refreshToken, loggedInUser} = await authService.verifyGoogleIdToken(idToken, deviceId);
     
     res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.ACCESS_TOKEN_EXP_SEC*1000
    })
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:config.REFRESH_TOKEN_EXP_SEC*1000
    }).status(200).json({
        success:true,
        message:"Logged In successfully",
        loggedInUser
    })
})