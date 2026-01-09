const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.join(__dirname, '..', '.env') })
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

async function sendMail(messageToSend, from = '<as9604793@gmail.com>', to, subject, html = '') {
    if (!messageToSend || !to) {
        throw new Error("No Message to Send and Receiver Account Found")
    }

    try {
        await transporter.sendMail({
            from,
            to,
            subject,
            text: messageToSend,
            // attachments: [{ filename: "Client Pulse Logo", content: fs.readFileSync(path.join(__dirname, '..', 'Client_Pulse_Logo.png')), cid: "logo@Client_Pulse" }],
            // html: html || '<p><img src="cid:logo@Client_Pulse" alt="Client Pulse Always For You.."></p>',
        })
    }
    catch (error) {
        console.log(error.message) // append log 
        throw new Error(error.message || "SMTP Servers are Busy Now")
    }
    finally {
        // NULL
    }
}

async function sendTestMail(messageToSend, from = '<no-reply@arjun.go.dev>', to, subject, html = '') {

    const testMail = await nodemailer.createTestAccount()

    const testMailTransporter = nodemailer.createTransport({
        host: testMail.smtp.host,
        port: testMail.smtp.port,
        auth: {
            user: testMail.user,
            pass: testMail.pass
        }
    })
    try {
        await testMailTransporter.sendMail({
            from,
            to,
            subject,
            text,
            attachments: [{ filename: "Client Pulse Logo", content: fs.readFileSync(path.join(__dirname, '..', 'Client_Pulse_Logo.png')), cid: "logo@Client_Pulse" }],
            html: html || '<p><img src="cid:logo@Client_Pulse" alt="Client Pulse Always For You.."></p>',
        })
    }
    catch (error) {
        // No Handle Test Only and Console it
    }
}

module.exports = { sendTestMail, sendMail }