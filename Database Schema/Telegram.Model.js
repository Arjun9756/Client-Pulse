const mongoose = require('mongoose')
const conversationSchema = new mongoose.Schema({
    groqMessage:String,
    userResponse:String,
    timestamp:{
        type:Date,
        default:Date.now()
    }
})

const telegramSessionSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    productName:{
        type:String,
        require:true
    },
    productDetails:{
        type:String
    },
    language:{
        type:String,
        default:'English'
    },
    userName:{
        type:String
    },
    stage:{
        type:String,
        default:'Intial'
    },
    summary:{
        type:String
    },
    conversationHistory:[conversationSchema],
    createAt:{
        type:Date,
        default:Date.now()
    },
    completedAt:Date,
    status:{
        type:String,
        default:'active'
    },
    method:{
        type:String,
        required:true
    }
})

const model = mongoose.model('TelegramSession' , telegramSessionSchema)
module.exports = model