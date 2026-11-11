
const { config } = require('../config');

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const minutes = (config.OTP_TTL || 300) / 60;

async function sendOtpEmail(email, otp) {
    if (!config.MAIL_SEND) {
        throw new Error('MAIL_SEND is not configured');
    }

    const msg = {
        to: email,
        from: `${config.MAIL_SEND}`,
        subject: 'Your IRCTC verification code',
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 420px;
                margin: auto;
                padding: 20px;
                border: 1px solid #e5e5e5;
                border-radius: 10px;
                background: #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            ">

                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4A3AFF; margin: 0;">DesignKarlo</h2>
                </div>

                <p style="font-size: 16px; color: #333;">
                    Hi,
                </p>

                <!-- OTP message -->
                <p style="font-size: 16px; color: #333;">
                    Your verification code is:
                </p>

                <div style="
                    font-size: 28px;
                    font-weight: bold;
                    background: #F4F4FF;
                    border-radius: 8px;
                    color: #4A3AFF;
                    border: 1px solid #e0e0ff;
                ">
                    ${otp}
                </div>

                <p style="font-size: 15px; color: #555;">
                    This code will expire in
                    <strong>${minutes} minutes</strong>.
                </p>

                <hr style="
                    border: none;
                    border-top: 1px solid #eee;
                    margin: 25px 0;
                " />

                <p style="font-size: 14px; color: #888; text-align: center;">
                    Happy Learning 🎉<br/>
                    <strong>Team DesignKarlo</strong>
                </p>

            </div>`
    };

    await sgMail.send(msg);
}

async function verifyOtpEmail(meta) {
    if (!config.MAIL_SEND) {
        throw new Error('MAIL_SEND is not configured');
    }

    const msg = {
        to: meta.email,
        from: `${config.MAIL_SEND}`,
        subject: 'Welcome to IRCTC, Email Verified',
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 420px;
                margin: auto;
                padding: 20px;
                border: 1px solid #e5e5e5;
                border-radius: 10px;
                background: #ffffff;
            ">
             
            </div>`
    };

    await sgMail.send(msg);
}

module.exports = {
    sendOtpEmail,
    verifyOtpEmail
};