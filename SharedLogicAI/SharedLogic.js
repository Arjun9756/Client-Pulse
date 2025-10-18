const { Groq } = require('groq-sdk')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({
    path: path.join(__dirname, '..', '.env')
})

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/*
    * Groq Intial Chat is the Statring Chat to send a very friendly Voice Message
    * Lama Versatile Model is Used
    * Function Name is intiateIntialChat
*/

async function intiateIntialChat(productName, productDetails, language, userName) {
    const prompt = `
        You are a friendly assistant working on behalf of a company.

        Your goal is to ask the user *${userName}* for their honest feedback about a product in a warm, conversational tone.

        Product Name: "${productName}"
        Product Details: "${productDetails}"
        Preferred Language: "${language}"
        Company Name is Pepsodent so make sure that communication is like that i am talking on behalf of Company Name My Name is A good name attack by yourself

        The message should:
        - Sound human-like and engaging.
        - Be suitable for voice (spoken naturally).
        - Encourage the user to share thoughts, experiences, or suggestions.
        - Be polite and personalized, without sounding like a bot or assistant.
                `.trim();

    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            reasoning_effort:"medium",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful, friendly assistant."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        })

        if (response && response.choices?.[0]?.message?.content) {
            return {
                status: true,
                message: response.choices[0].message.content
            }
        }

        throw new Error("No Message From Groq")
    }
    catch (error) {
        console.log(error.message)
        return {
            status: false,
            message: error.message
        }
    }
}


async function handleChat(productName, productDetails, language, history) {
    const message = [
        {
            role: "system",
            content: `
  You are a helpful assistant. Ask for product feedback and return response along with a flag:
  Is the user's feedback complete? Use a boolean flag: completed: true/false.
  Your response should be:
  {
    "reply": "Your feedback message here",
    "completed": true/false
  }
`
        },
        {
            role: "user",
            content: `Product: ${productName}\nDetails: ${productDetails}\nLanguage: ${language}`
        },
        ...history.flatMap((h) => [
            { role: "assistant", content: h.groq || '...' },
            { role: "user", content: h.userResponse || '...' }
        ])
    ]

    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            reasoning_effort:"high",
            messages: message
        })

        const raw = response.choices[0].message.content.trim()

        let parsed;
        try {
            const match = raw.match(/\{[\s\S]*?\}/)
            if (match) {
                parsed = JSON.parse(match[0])
            } else {
                throw new Error("No JSON object found")
            }
        } catch (e) {
            parsed = { reply: raw, completed: false }
        }

        return {
            status: true,
            message: parsed.reply,
            isSatisfied: parsed.completed
        }
    }
    catch (error) {
        return {
            status: false,
            message: "Error in Handling the Chat",
            isSatisfied: false
        }
    }
}

async function generateSummary(productName, productDetails, language, userHistory) {
    const prompt = `
        You are a feedback summarization assistant.

        Your task is to read the conversation history between the assistant and the user regarding a product and generate a clear, short, and meaningful summary of the user's feedback.

        Product Name: "${productName}"
        Product Details: "${productDetails}"
        Preferred Language: "${language}"

        Here is the full chat history:

        ${userHistory.map((entry, i) =>
        `Assistant: ${entry.groq || '...'}\nUser: ${entry.userResponse || '...'}`
    ).join('\n\n')}

        Please return:
        - A friendly and concise summary of what the user said.
        - Focus on suggestions, complaints, compliments, or general experience shared by the user.
        - Output in the English language only.

        The summary should be natural, professional, and human-like — suitable for sending to a product team.
        Give The summary only nothing else.
        `.trim();


    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            reasoning_effort:"high",
            tools:[{"type":"browser_search"}],
            messages: [
                {
                    role: 'system',
                    content: prompt
                }
            ]
        })

        if (response) {
            return {
                status: true,
                summary: response.choices[0].message.content
            }
        }

        throw new Error("Error in Generating the Summary")
    }
    catch (error) {
        return {
            status: false,
            summary: error.message
        }
    }
}

module.exports = {intiateIntialChat , handleChat , generateSummary}