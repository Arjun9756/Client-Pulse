const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config({path:path.join(__dirname , '..' , '.env')})
const fs = require('fs')

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:process.env.SMTP_PORT,
    secure:process.env.SMTP_SECURE || false,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS,
    }
})

const testMail = await nodemailer.createTestAccount()
const testMailTransporter = nodemailer.createTransport({
    host:testMail.smtp.host,
    port:testMail.smtp.port,
    auth:{
        user:testMail.user,
        pass:testMail.pass
    }
})

async function sendMail(messageToSend , from='<no-reply@arjun.go.dev>' , to , subject , html=''){
    if(!messageToSend || !to){
        throw new Error("No Message to Send and Receiver Account Found")
    }

    try{
        await transporter.sendMail({
            from,
            to,
            subject,
            text:messageToSend,
            attachments:[{filename:"Client Pulse Logo" , content:fs.readFileSync(path.join(__dirname , '..' , 'Client_Pulse_Logo.png')) , cid:"logo@Client_Pulse"}],
            html:'<p><img src="cid:logo@Client_Pulse" alt="Client Pulse Always For You.."></p>',
        })
    }
    catch(error){
        console.log(error.message) // append log 
        throw new Error(error.message || "SMTP Servers are Busy Now")
    }
    finally{
        // NULL
    }
}

async function sendTestMail(messageToSend , from='<no-reply@arjun.go.dev>' , to , subject , html=''){
    try{
        await testMailTransporter.sendMail({
            from,
            to,
            subject,
            text,
            attachments:[{filename:"Client Pulse Logo" , content:fs.readFileSync(path.join(__dirname , '..' , 'Client_Pulse_Logo.png')) , cid:"logo@Client_Pulse"}],
            html:'<p><img src="cid:logo@Client_Pulse" alt="Client Pulse Always For You.."></p>',
        })
    }
    catch(error){
        // No Handle Test Only and Console it
    }
}

module.exports = {sendTestMail , sendMail}