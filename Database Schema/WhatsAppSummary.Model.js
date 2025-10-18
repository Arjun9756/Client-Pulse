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

const whatsappSummarySchema = new mongoose.Schema({
    Name:{
        type:String,
        required:true,
        trim:true
    },
    Service:{
        type:String,
        default:"WhatsApp",
        require:true
    },
    contact:{
        type:String,
        required:true,     // Mandatory Aspect
        trim:true
    },
    ProductDeatils:{
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

const whatsappSummaryModel = mongoose.model('whatsappSummaryModel' , whatsappSummarySchema)
module.exports = whatsappSummaryModel