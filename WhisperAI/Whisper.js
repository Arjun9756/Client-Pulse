const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { Groq } = require('groq-sdk')
const dotenv = require('dotenv')

dotenv.config({
    path: path.join(__dirname, '..', '.env')
})
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function voiceToText(fileLink, name) {
    const outputDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, `${name}.ogg`);

    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(fileLink, { responseType: 'stream' });

    await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    try {
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
            response_format: "verbose_json",
            prompt: "This is a product feedback audio from a user. Please transcribe only what the user actually says, do not add anything extra or generic phrases. Ignore any background noise or silence."
        });

        fs.unlinkSync(filePath); // Delete the local file after transcription

        return {
            status: true,
            message: transcription.text 
        };
    } catch (error) {
        console.log(`Error While Transcription of text WhisperAI`);
        return {
            status: false,
            message: `Error in Transcription of Text WhisperAI`
        };
    }
}

module.exports = voiceToText