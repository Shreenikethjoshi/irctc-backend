const { ConflictError, BadRequestError } = require("../utils/error")
const {generateAndStoreOtp,verifyOtp}= require('../utils/otp')
const {sendOtpEmail,verifyOtpEmail}=require('../utils/email')
const bcrypt = require('bcrypt')
const prisma = require('../config/prisma')



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




module.exports={sendOTP,verifyOTP}