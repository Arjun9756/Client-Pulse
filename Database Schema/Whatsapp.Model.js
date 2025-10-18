const mongoose = require('mongoose')
const conversationSchema = new mongoose.Schema({
    groqMessage:{
        type:String
    },
    userResponse:{
        type:String
    },
    timestamps:{
        type:Date,
        default:Date.now()
    }
})

const whatsappSchema = new mongoose.Schema({
    phoneNumber:{
        type:String,
        required:true
    },
    productName:{
        type:String,
        required:true
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

const whatsappModel = mongoose.model('WhatsappSession' , whatsappSchema)
module.exports = whatsappModel