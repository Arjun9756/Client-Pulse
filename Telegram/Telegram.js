const Telegram = require('node-telegram-bot-api')
const dotenv = require('dotenv')
const path = require('path')
const ElevenLabs = require('../ElevenLabs/ElevenLabs')
const fs = require('fs')
const WhisperAI = require('../WhisperAI/Whisper')
const { Redis } = require('ioredis')
const TelegramSession = require('../Database Schema/Telegram.Model')
const {handleChat , intiateIntialChat , generateSummary} = require('../SharedLogicAI/SharedLogic')
const { Queue } = require('bullmq')

async function createSession(userId , productName , productDetails , language , userName){
    const session = await TelegramSession.create({
        userId,
        productName,
        productDetails,
        language,
        userName,
        method:"Telegram"
    })
    if(!session){
        return {
            status:false
        }
    }
    return {
        _id:session._id,
        status:true
    }
}

async function addMessage(sessionId , groqMessage , userResponse){
    await TelegramSession.findByIdAndUpdate(sessionId , {
        $push:{
            conversationHistory:{
                groqMessage,
                userResponse
            }
        }
    })
}

async function completeSession(sessionId , summary){
    await TelegramSession.findByIdAndUpdate(sessionId , {
        summary,
        completedAt:new Date(),
        status:'completed'
    })
}

/*
    * Function to Handle Database For Telegram Model
    * Create Session , addMessage , compleSession
*/

dotenv.config({
    path: path.join(__dirname, '..', '.env')
})

const bot = new Telegram(process.env.TELEGRAMBOTTOKEN, {
    polling: true  // Automcatically Bot Can Be Active While Sending the Message
})

const redis = new Redis({
    host:process.env.REDIS_HOST,
    password:process.env.REDIS_PASSWORD,
    port:process.env.REDIS_PORT
})

const feedbackQueue = new Queue('telegramFeedbackQueue' , {
    connection:{
        host:process.env.REDIS_HOST,
        password:process.env.REDIS_PASSWORD,
        port:process.env.REDIS_PORT
    }
})

const mailQueue = new Queue('mailQueue' , {
    connection:{
        host:process.env.REDIS_HOST,
        password:process.env.REDIS_PASSWORD,
        port:process.env.REDIS_PORT
    }
})

/* 
    * Function to send the Messgae via Bot to ths userID
    * Send Message with capaction
*/

async function sendMessage(userId, text) {
    try {
        text = text.trim()
        await bot.sendMessage(userId, text)
        return {
            status: true,
            message: `Message is Sent to userID ${userId}`
        }
    }
    catch (error) {
        console.log(`Erro While Sending Text Message via Telegram Bot to userId ${userId}`)
        return {
            status: false,
            message: error.message
        }
    }
}

/* 
    * Function to Send the Message Via Voice as Telegram support on .ogg voice 
    * Instead of that we will send the .mp3 version as a audio
*/

async function sendVoice(userId, text) {
    try {
        const voiceOuput = await ElevenLabs(text)
        if (voiceOuput.status === true) {
            await bot.sendAudio(userId, voiceOuput.outputFilePath)
            fs.unlinkSync(voiceOuput.outputFilePath)
        }

        return {
            status: true,
            message: `Voice Sent Successfuly via Bot to userId ${userId}`
        }
    }
    catch (error) {
        console.log(`Error while Sending Voice Via Telegram to userId ${userId}`)
        return {
            status: false,
            message: `Failed to Sent Voice Via Telegram to userID ${userId}`
        }
    }
}

/*
    * Voice to text will be converted by the Groq Whisper 
    * Groq Whisper Will be An Abstraction which is responsible to Download and fecth the Voice
*/

async function convertVoiceToText(fileId) {
    try {
        const whisperFilePath = await WhisperAI(await bot.getFileLink(fileId), fileId) // { Link To Download , Name to Save }
        if (whisperFilePath.status === true) {
            return {
                status: true,
                message: whisperFilePath.message
            }
        }

        throw new Error(whisperFilePath.message)
    }
    catch (error) {
        console.log(error.message)
        return {
            status: false,
            message: error.message
        }
    }
}


async function main(userId, productName, productDetails, language, userName , gmail="") {
    try {
        let user = await redis.get(userId)
        if (!user) {            // If it is an Intial Chat
            await redis.set(userId, JSON.stringify({
                date: Date.now(),
                productName: productName,
                productDetails: productDetails,
                userLanguage: language,
                userHistory: [],
                stage: "Intial Stage",
                userName: userName,
                gmailId:gmail,
                _id:null
            }))
        }

        user = JSON.parse(await redis.get(userId))
        await redis.expire(userId, 86400)

        /* 
            * Sending the Inital Voice Message To the User Via Bot
            * Generate The audio from Elevenlabs and Send To User ID
        */

        const initalChat = await intiateIntialChat(user.productName, user.productDetails, user.userLanguage, user.userName)

        /* 
            Create The session for user in telegram
        */
        try
        {
            let {status , _id} = await createSession(userId , productName , productDetails , language , userName)
            user._id = _id
            await redis.set(userId , JSON.stringify(user))
        }
        catch(err){
            console.log("Error while creating the session")
        }


        if (!initalChat.status) {
            throw new Error(initalChat.message)
        }

        user.userHistory.push({
            groq: initalChat.message,
            userResponse: "Waiting for User Response"
        })

        await redis.set(userId, JSON.stringify(user))
        // Saving the Intital Chat Response
        await addMessage(user._id , initalChat.message , "Waiting For User Response")

        const voiceResponse = await sendVoice(userId, initalChat.message)
        if (voiceResponse.status === false) {
            throw new Error(voiceResponse.message)
        }
    }
    catch (error) {
        console.log(`Error in main function : ${error.message}`)
    }
}

// Managing The Bot With Dynamic Behaviour
bot.on('message', async (msg) => {

    const userId = msg.chat.id
    const user = JSON.parse(await redis.get(userId))
    
    if(!user){
        await sendMessage(userId , "Sorry Your Session Has Been Expired Company Will Reach You Again")
        return
    }
    let _id = user._id

    const userText = msg.text
    const lastHistory = user.userHistory[user.userHistory.length - 1]

    if (lastHistory && lastHistory.userResponse === "Waiting for User Response") {
        lastHistory.userResponse = userText
    } else {
        user.userHistory.push({ userResponse: userText })
    }

    const response = await handleChat(user.productName, user.productDetails, user.userLanguage, user.userHistory)

    // Adding message to the databases
    await addMessage(_id , response.message , lastHistory.userResponse)

    user.userHistory.push({
        groq: response.message,
        userResponse: "Waiting for User Response"
    })

    if (response.status === true && response.isSatisfied === true) {
        const summary = await generateSummary(user.productName, user.productDetails, user.userLanguage, user.userHistory)
        user.stage = "Completed"

        if (summary.status === true) {
            console.log("🟢 Summary generated:\n", summary.summary)
            await sendMessage(userId , "Thanks For Your Valueable Feedback we will always consider it Signature on Behalf of XYZ Company")
            await completeSession(_id , summary.summary)

            await feedbackQueue.add('user' , {
                userName:user.userName,
                productName:user.productName,
                productDetails:user.productDetails,
                language:user.language,
                userId:user._id,
                summary:summary.summary,
                service:"Telegram",
                gmailId:user.gmailId
            })

            await mailQueue.add('sendMail' , {
                userName:user.userName,
                productName:user.productName,
                productDetails:user.productDetails,
                language:user.language,
                userId:user._id,
                summary:summary.summary,
                service:"Telegram",
                gmailId:user.gmailId
            },{
                removeOnComplete:true,
                attempts:4,
                backoff:{type:"exponential" , delay:5000},
                removeOnFail:true,
                priority:3,
                timeout:10000
            })

            await redis.del(userId)      // Delete the session of user
        }

        return {
            status: false,
            summary: "There was Some Error in Backend by this we are not able to create the summary",
            history: user.userHistory
        }
    }

    await sendMessage(userId, response.message?.toString?.() || "Thanks for your response.")
    await redis.set(userId, JSON.stringify(user))
})

bot.on('voice', async (msg) => {

    const userId = msg.chat.id
    const user = JSON.parse(await redis.get(userId))
    
    if(!user){
        await sendMessage(userId , "Sorry Your Session Has Been Expired Company Will Reach You Again")
        return
    }
    let _id = user._id 

    const fileId = msg.voice.file_id
    const voiceToText = await convertVoiceToText(fileId)

    if (voiceToText.status === false) {
        await sendMessage(userId, "Sorry, couldn't understand your voice")
        return
    }

    if (voiceToText.status === true && voiceToText.message) {
        const userText = voiceToText.message.trim();
        const lastHistory = user.userHistory[user.userHistory.length - 1];

        if (lastHistory && lastHistory.userResponse === "Waiting for User Response") {
            lastHistory.userResponse = userText;
        } else {
            user.userHistory.push({ userResponse: userText });
        }
    } else {
        await sendMessage(userId, "Sorry, couldn't understand your voice");
        return;
    }

    const response = await handleChat(user.productName, user.productDetails, user.userLanguage, user.userHistory)

    //Adding message of user
    await addMessage(_id , response.message , voiceToText.message)

    user.userHistory.push({ groq: response.message, userResponse: "Waiting for User Response" })

    await redis.set(userId, JSON.stringify(user))
    if (response.status === true && response.isSatisfied === true) {
        const summary = await generateSummary(user.productName, user.productDetails, user.userLanguage, user.userHistory)
        if (summary.status === true) {

            user.stage = "Completed"
            await feedbackQueue.add('user' , {
                userName:user.userName,
                productName:user.productName,
                productDetails:user.productDetails,
                language:user.userLanguage,
                userId:user._id,
                summary:summary.summary,
                service:"Telegram",
                gmailId:user.gmailId
            })

            await mailQueue.add('sendMail' , {
                userName:user.userName,
                productName:user.productName,
                productDetails:user.productDetails,
                language:user.language,
                userId:user._id,
                summary:summary.summary,
                service:"Telegram",
                gmailId:user.gmailId
            },{
                removeOnComplete:true,
                attempts:4,
                backoff:{type:"exponential" , delay:5000},
                removeOnFail:true,
                priority:3,
                timeout:10000
            })
            await redis.del(userId)

            await sendVoice(userId , "Thanks For Your Valueable Feedback we will strongly consider it")
            console.log(summary.summary)
            await completeSession(_id , summary.summary)
        }

        return {
            status: false,
            summary: "Error in Backend for Generating the Summary",
            userHistory: user.userHistory
        }
    }
    if (response.status === true && response.isSatisfied === false) {
        await sendMessage(userId, response.message)
    }
})

module.exports = main