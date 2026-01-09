const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.join(__dirname, '.env') })
const fs = require('fs')

const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST_NAME,
    port: parseInt(process.env.NODEMAILER_PORT),
    secure: (process.env.NODEMAILER_SECURE == true ? true : false),
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    }
})

console.log(typeof parseInt(process.env.NODEMAILER_PORT))
const date = new Date()