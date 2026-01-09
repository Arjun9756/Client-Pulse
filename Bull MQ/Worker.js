const {Worker} = require('bullmq')
const path = require('path')
const Whatsapp = require('../Whatsapp/Whatsapp')
const Telegram = require('../Telegram/Telegram')
const db = require('../Database/Database')
const telegramSummaryModel = require('../Database Schema/TelegramSummary.Model')
const whatsappSummaryModel = require('../Database Schema/WhatsAppSummary.Model')
const {sendMail} = require('../Utils/Gmail.SMTP')
db()

require('dotenv').config({
    path:path.join(__dirname , '..' , '.env')
})

const redisConnection = {
    host:process.env.REDIS_HOST,
    password:process.env.REDIS_PASSWORD || undefined,
    port:parseInt(process.env.REDIS_PORT)
}

const worker = new Worker('Users' , async (msg)=>{

    let productName = msg.data.ProductName
    let productDetails = msg.data.ProductDetails
    let gmail = msg.data.Gmail
    let contact = msg.data.Contact
    let userId = msg.data.UserId
    let language = msg.data.language
    let userName = msg.data.UserName
    let service = msg.data.Service
    let status = msg.data.Service
    let summary = msg.data.Summary

    // If Userid is Present Delegate Request to Telegram
    if(userId && service.toUpperCase() === 'TELEGRAM')
    {
        Telegram(userId , productName , productDetails , language , userName, gmail)
    }

    // If Contact is present Delegate request to Whatsapp
    if(contact && contact.length == 10 && service.toUpperCase() === 'WHATSAPP')
    {
        Whatsapp(contact , productName , productDetails , language , userName)
    }

    // Greater Implementation for Twillo Phone Call
    // Twillo()

    if(contact && contact.length == 10 && service.toUpperCase() === 'CALL')
    {
        // Future Service
    }
},
{
    connection:redisConnection,
    concurrency:parseInt(process.env.REDIS_CONCURRENCY) || 1
})

const telegramWorker = new Worker('telegramFeedbackQueue' , async (msg)=>{
    let productName = msg.data.productName
    let productDetails = msg.data.productDetails
    let userId = msg.data.userId
    let summary = msg.data.summary
    let userName = msg.data.userName
    let language = msg.data.language
    let gmailId = msg.data.gmailId

    // Save To Mongo DB
    const saveToTelegram = new telegramSummaryModel({
        Name:userName,
        UserId:userId,
        ProductDetails:{
            productName:productName,
            productDetails:productDetails
        },
        GeneratedSummary:summary,
        Gmail:gmailId
    })

    await saveToTelegram.save();
    console.log(`Saved to Telegram Data is ${saveToTelegram}`)

},{
    connection:redisConnection,
    concurrency:parseInt(process.env.REDIS_CONCURRENCY) || 1
})

const whatsappWorker = new Worker('whatsappFeedbackQueue' , async (msg)=>{
    let productName = msg.data.productName
    let productDetails = msg.data.productDetails
    let summary = msg.data.summary
    let userName = msg.data.userName
    let language = msg.data.language
    let contact = msg.data.contact
    let gmailId = msg.data.gmail
    
    //Save to Mongo DB
    let saveToWhatsapp = new whatsappSummaryModel({
        Name:userName,
        contact:contact,
        ProductDetails:{
            productName,
            productDetails
        },
        GeneratedSummary:summary,
        Gmail:gmailId
    })
    await saveToWhatsapp.save()
    console.log("Saved to Whatsapp DB")

},{
    connection:redisConnection,
    concurrency:parseInt(process.env.REDIS_CONCURRENCY) || 1
})

const mailWorker = new Worker('mailQueue' , async (msg)=>{
    let {productName , productDetails , userName , summary , language , contact , gmailId } = await msg.data
    console.log(await msg.data)
    if(!gmailId){
        throw new Error("NON_RETRYABLE_ERROR")
    }
    try{
        const messageToSend = `Thanks For Providing Your Feedback On Client Pulse We Will Strongly Consider It This Mail Is Forwarded To Respected Compnay`
        const subject = `Product Feedback`
        await sendMail(messageToSend , "<as9604793@gmail.com>" , gmailId , subject)
        console.log("Mail sent") 
    }
    catch(error){
        appendLogMetrics("Sending Mail Via SMTP Error " , error.message)
        throw new Error(error.message)
    }
    finally{
        // NULL
    }
},{
    connection:redisConnection,
    concurrency:parseInt(process.env.REDIS_CONCURRENCY) || 1
})