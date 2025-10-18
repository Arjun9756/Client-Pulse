const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({
    path:path.join(__dirname , '..' , '.env')
})

async function connectDB()
{
    try
    {
        let connection = await mongoose.connect(process.env.MONGO_URI)
        console.log(`Monngo DB Connected Successfully`)
    }
    catch(err){
        console.log(`Error in Connecting MongoDB`)
    }
}

module.exports = connectDB