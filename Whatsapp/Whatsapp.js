const axios = require('axios')
const { Redis } = require('ioredis')
const FormData = require('form-data')
const ElevenLabs = require('../ElevenLabs/ElevenLabs')
const { intiateIntialChat, handleChat, generateSummary } = require('../SharedLogicAI/SharedLogic')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const WhatsappSession = require('../Database Schema/Whatsapp.Model')
const express = require('express')
const router = express.Router()
const WhisperAI = require('../WhisperAI/Whisper')
const { Queue } = require('bullmq')

dotenv.config({
    path: path.join(__dirname, '..', '.env')
})

const feedbackQueue = new Queue('whatsappFeedbackQueue', {
    connection: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT
    }
})

const redis = new Redis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT
})

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

/*
    * Create Database Session for the Whatsapp
*/

async function createSession(phoneNumber, productName, productDetails, language, userName) {
    const session = await WhatsappSession.create({
        phoneNumber: phoneNumber,
        productName: productName,
        productDetails: productDetails,
        language: language,
        userName: userName,
        method: "whatsapp"
    })
    return {
        status: true,
        _id: session._id
    }
}

async function addMessage(_id, groqMessage, userResponse) {
    try {
        await WhatsappSession.findByIdAndUpdate(_id, {
            $push: {
                conversationHistory: {
                    groqMessage: groqMessage,
                    userResponse: userResponse
                }
            }
        })

        return {
            status: true,
            message: "Message Added to Database of whatsapp"
        }
    }
    catch (err) {
        return {
            status: false,
            message: "Not able to add message of whatsapp in database"
        }
    }
}

async function completeSession(sessionId, summary) {
    await WhatsappSession.findByIdAndUpdate(sessionId, {
        summary,
        completedAt: new Date(),
        status: 'completed'
    })
}


/*
    * Function to send the message to the To phone number
    * Accept PHONE_NUMBER && Text
*/

async function sendMessage(phoneNumber, text) {
    text = text.trim()
    try {
        let respone = await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            text: { body: text }
        }, {
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
        })

        if (respone.status) {
            return {
                status: true,
                message: "Message is Delivered via whatsapp"
            }
        }
    }
    catch (err) {
        console.log(`Error while sending messgae with whatsapp`)
        return {
            status: false,
            message: "Error while sending messgae with whatsapp"
        }
    }
}

/* 
    * Function to send the voice message to whatsapp
    * Accept the phone Number and text to generate 
*/

async function sendVoice(phoneNumber, text) {
    try {
        const voiceOutput = await ElevenLabs(text)
        const audioData = fs.createReadStream(voiceOutput.outputFilePath)

        const form = new FormData()
        form.append('file', audioData)
        form.append('type', 'audio/mpeg')
        form.append('messaging_product', 'whatsapp')

        // Phele Upload hoga server pe
        const upload = await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/media`, form , {
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, ...form.getHeaders() }
        })

        const mediaId = upload.data.id
        const response = await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'audio',
            audio: { id: mediaId }
        }, {
            headers: { Authorization: `Bearer${WHATSAPP_TOKEN}` }
        })

        return {
            status: true,
            message: "Voice is sent"
        }
    }
    catch (err) {
        return {
            status: false,
            message: "Error in sending voice message via whatsapp"
        }
    }
}


async function main(phoneNumber, productName, productDetails, language, userName , gmail = "") {
    try {
        const userId = await redis.get(phoneNumber)
        if (!userId) {
            await redis.set(phoneNumber, JSON.stringify({
                userName: userName,
                _id: null,
                productName: productName,
                productDetails: productDetails,
                date: Date.now(),
                userHistory: [],
                userLanguage: language,
                stage: "Intial Stage",
                method: "whatsapp",
                gmailId:gmail
            }))

            await redis.expire(phoneNumber, 86400)
        }

        const user = JSON.parse(await redis.get(phoneNumber))
        // Create the Session For User
        const { status, _id } = await createSession(phoneNumber, productName, productDetails, language, userName)
        user._id = _id

        // Intiate Intial Chat
        const intitalChat = await intiateIntialChat(productName, productDetails, language, userName)

        if (intitalChat.status === true) {
            // Send both text and voice responses
            const [textSent, voiceSent] = await Promise.all([
                sendMessage(phoneNumber, intitalChat.message),
                sendVoice(phoneNumber, intitalChat.message)
            ]);

            user.userHistory.push({
                groqMessage: intitalChat.message,
                userResponse: "Waiting for user response"
            })

            if (voiceSent.status === true) {
                await addMessage(_id, intitalChat.message, "Waiting for user response")
                await redis.set(phoneNumber, JSON.stringify(user))
            }
            else {
                // Thorw error
                throw new Error(voiceSent.message)
            }
        }
        else {
            throw new Error(intitalChat.message)
        }
    }
    catch (err) {
        console.log(`Error in Main Function ${err.message}`)
    }
}


/*  
    * Handling the API Between Meta Cloud API's And Our System
    * Webhook is going to used
    * Webhook means one app can communicate with another without and manual event it automatically gets call whenever something happens
*/

router.post('/webhook', async (req, res) => {
    const body = req.body

    try {
        const entry = body.entry?.[0]
        const changes = entry.changes?.[0]
        const values = changes?.values
        const messages = values?.messages

        if (messages && messages.length > 0) {
            const message = messages[0]
            const phoneNumber = message.from
            const messageType = message.type

            // Redis Logic
            const user = JSON.parse(await redis.get(phoneNumber))
            if (!user) {
                sendMessage(phoneNumber, "Session is Expired Company Will Contact You Soon!!")
                return
            }
            const _id = user._id

            if (messageType == "text") {
                const userText = message.text.body
                if (user.userHistory.length > 0 && user.userHistory[user.userHistory.length - 1].userResponse === "Waiting for user response") {
                    user.userHistory[user.userHistory.length - 1].userResponse = userText.trim()
                }

                const chatHandle = await handleChat(user.productName, user.productDetails, user.userLanguage, user.userHistory)
                await addMessage(_id, chatHandle.message, "Waiting for User")

                user.userHistory.push({
                    groqResponse: chatHandle.message,
                    userResponse: 'Waiting for user response'
                })

                await redis.set(phoneNumber, JSON.stringify(user))

                if (chatHandle.status === true && chatHandle.isSatisfied === true) {
                    // AI IS SATISY GENERATE SUMMARY
                    const summary = await generateSummary(user.productName, user.productDetails, user.language, user.userHistory)

                    if (summary.status === true) {

                        console.log("Summary Generated Successfully from Whatsapp")
                        user.stage = "Completed"

                        await redis.set(phoneNumber, JSON.stringify(user))
                        await completeSession(_id, summary.summary)

                        await feedbackQueue.add('feedback', {
                            userName: user.userName,
                            productName: user.productName,
                            productDetails: user.productDetails,
                            language: user.userLanguage,
                            summary: summary.summary,
                            contact: phoneNumber,
                        })
                        await redis.del(phoneNumber)
                    }
                }
                else if (chatHandle.status === true && chatHandle.isSatisfied === false) {
                    await sendMessage(phoneNumber, chatHandle.message)
                }
                else {
                    throw new Error(chatHandle.message)
                }
            }
            else if (messageType === 'voice') {
                const mediaId = message.voice.id

                //1. Get The media URL from Whatsapp Server
                const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
                    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
                })

                const mediaURL = mediaResponse.data.url

                //2.Transcribe the voice are WHisper Use karo yar
                const voiceToText = await WhisperAI(mediaURL, mediaId)
                if (voiceToText.status === false) {
                    await sendMessage(phoneNumber, "Sorry, couldn't understand your voice")
                    return
                }

                const userText = voiceToText.message.trim()
                if (user.userHistory.length > 0 && user.userHistory[user.userHistory.length - 1].userResponse === "Waiting for user response") {
                    user.userHistory[user.userHistory.length - 1].userResponse = userText
                } else {
                    user.userHistory.push({ userResponse: userText });
                }

                const chatHandle = await handleChat(user.productName, user.productDetails, user.userLanguage, user.userHistory)
                await addMessage(_id, chatHandle.message, userText)

                user.userHistory.push({
                    groqResponse: chatHandle.message,
                    userResponse: "Waiting for user response"
                })

                await redis.set(phoneNumber, JSON.stringify(user))
                if (chatHandle.status === true && chatHandle.isSatisfied === true) {
                    const summary = await generateSummary(user.productName, user.productDetails, user.language, user.userHistory)

                    if (summary.status === true) {

                        console.log("Summary Generated Successfully from Whatsapp")
                        user.stage = "Completed"

                        await redis.set(phoneNumber, JSON.stringify(user))
                        await completeSession(_id, summary.summary)

                        await feedbackQueue.add('feedback', {
                            userName: user.userName,
                            productName: user.productName,
                            productDetails: user.productDetails,
                            language: user.userLanguage,
                            summary: summary.summary,
                            contact: phoneNumber
                        })
                        await redis.del(phoneNumber)
                    }
                    else if (chatHandle.status === true && chatHandle.isSatisfied === false) {
                        await sendMessage(phoneNumber, chatHandle.message)
                    } else {
                        throw new Error(chatHandle.message)
                    }
                }
            }
        }
    }

    catch (err) {
        console.error("Error in WhatsApp webhook:", err)
        res.status(500).json({ 
            status: false, 
            message: "Internal server error in processing WhatsApp message" 
        })
        return
    }
    
    // Acknowledge webhook
    res.status(200).json({ status: true })
})

module.exports = main