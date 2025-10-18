const express = require('express')
const app = express()
const cluster = require('cluster')
const os = require('os')
const path = require('path')
const dotenv = require('dotenv')
const GoogleSheet = require('./GoogleSheet/SheetHandler')

dotenv.config({
    path:path.join(__dirname , '..' , '.env')
})

if(cluster.isPrimary)
{   
    for(let i=0 ; i<os.cpus().lenth ; i++)
        cluster.fork()

    cluster.on('exit' , (thread)=>{
        console.log(`Thread With PID ${thread.pid} is Dead Restrating....`)
        cluster.fork()
    })
}
else
{
    app.listen(process.env.PORT || 3000 , ()=>{
        console.log(`Server is Running on PORT ${process.env.PORT || 3000}`)
    })
}