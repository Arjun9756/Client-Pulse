const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config({
    path:path.join(__dirname , '..' , '.env')
})

async function getElevenLabsVoice(text)
{
    try
    {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128' , {
            method:"POST",
            headers:{
                'xi-api-key':process.env.ELEVENLABS_API,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                text:text,
                model_id:'eleven_multilingual_v2'
            })
        })

        const outputDir  = path.join(__dirname , 'ElevenVoice')
        if(!fs.existsSync(outputDir)){  
            fs.mkdirSync(outputDir , {recursive:true})
        }

        const outputFilePath = path.join(__dirname , 'ElevenVoice' , `${Date.now()}_output.mp3`)

        const audioBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(audioBuffer)

        fs.writeFileSync(outputFilePath , buffer)
        console.log('File Created Successfuly')
        return {
            status:true,
            outputFilePath:outputFilePath
        }
    }
    catch(error){
        console.log(`Error in Eleven Labs API`)
        return {
            status:false,
            ErrorMessage:`Error : ${error.message}`
        }
    }
}

module.exports = getElevenLabsVoice