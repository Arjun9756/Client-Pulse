const mongoose = require('mongoose')
const ProductDeatilsSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true,
        trim:true
    },
    productDetails:{
        type:String,
        required:true,
        trim:true
    }
},{timestamps:true})

const telegramSummarySchema = new mongoose.Schema({
    Name:{
        type:String,
        required:true,
        trim:true
    },
    Service:{
        type:String,
        default:"Telegram",
        require:true
    },
    UserId:{
        type:String,
        required:true,     // Mandatory Aspect
        trim:true
    },
    ProductDetails:{
        type:ProductDeatilsSchema,
        required:true
    },
    GeneratedSummary:{
        type:String,
        required:true,
        trim:true
    },
    Gmail:{
        type:String,
        trim:true
    }
},{timestamps:true})

const telegramSummaryModel = mongoose.model('telegramSummaryModel' , telegramSummarySchema)
module.exports = telegramSummaryModel