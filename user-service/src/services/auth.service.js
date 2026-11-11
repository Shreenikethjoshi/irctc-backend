const { ConflictError, BadRequestError, ForbiddenError } = require("../utils/error")
const {generateAndStoreOtp,verifyOtp}= require('../utils/otp')
const {sendOtpEmail,verifyOtpEmail}=require('../utils/email')
const bcrypt = require('bcrypt')
const prisma = require('../config/prisma')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/auth")
const {config} = require('../config')
const jwt = require('jsonwebtoken')
const { redis } = require('../config/redis')



const sendOTP=async(firstName,lastName,email,password)=>{
    const existingUser=await prisma.user.findUnique({
        where:{email}
    })
    if(existingUser){
        throw new ConflictError("user alreayd exists")
    }
    const hashedPassword=await bcrypt.hash(password,12);
    const meta = {firstName,lastName,email,hashedPassword};
    const {otp,otpSessionId}= await generateAndStoreOtp(meta);
    await sendOtpEmail(email,otp);
    return {otpSessionId}
}


const verifyOTP = async(otp,otpSessionId)=>{
    const meta = await verifyOtp(otp,otpSessionId);
    if(!meta){
        throw new BadRequestError("Invalid or expired otp")
    }
    const user = await prisma.user.create({
        data:{
            firstName:meta.firstName,
            lastName:meta.lastName,
            email:meta.email,
            password:meta.hashedPassword,
            emailVerified:true
        }
    })
    await verifyOtpEmail(meta);
    return user;
}

const login = async(email,password,deviceId)=>{
    const existingUser= await prisma.user.findUnique({
        where : {email}
    })
    if(!existingUser){
        throw new BadRequestError("email not found")
    }
    const doesPasswordMatch = await bcrypt.compare(password,existingUser.password);
    if(!doesPasswordMatch){
        throw new BadRequestError("Incorrect password");
    }
    const accessToken = generateAccessToken(existingUser.id);
    const refreshToken = generateRefreshToken(existingUser.id);
    const {jti} = jwt.decode(refreshToken);
    await redis.set(`refresh:${existingUser.id}:${deviceId}`,jti,'EX',config.REFRESH_TOKEN_EXP_SEC);
    const {password:_password, ...safeUser}=existingUser;
    await redis.set(`user:${existingUser.id}`,JSON.stringify(safeUser),'EX',config.REDIS_USER_TTL);
    return {accessToken,refreshToken,loggedInUser:safeUser}

}

const rotateRefreshToken = async(refreshToken,deviceId)=>{
    const payload = verifyRefreshToken(refreshToken);
    const {id:userId,jti} = payload;
    const storedjti = await redis.get(`refresh:${userId}:${deviceId}`);
    if(!storedjti){
        throw new ForbiddenError("session expired","LOGIN AGAIN")
    }
    if(storedjti!==jti){
        await redis.del(`refresh:${userId}:${deviceId}`);
        throw new ForbiddenError("refresh token reused","Login again")
    }
    const newaccessToken=generateAccessToken(payload.id);
    const newrefreshToken  = generateRefreshToken(payload.id);
    const {jti:newJti} = jwt.decode(newrefreshToken);
    await redis.set(`refresh:${payload.id}:${deviceId}`,newJti,'EX',config.REFRESH_TOKEN_EXP_SEC)
    return {newaccessToken,newrefreshToken}
}

module.exports={sendOTP,verifyOTP,login,rotateRefreshToken}