# ClientPulse Backend

A comprehensive feedback collection system that integrates with Telegram, WhatsApp, and Google Sheets using AI-powered conversations.

## 🚀 Features

- **Multi-Platform Support**: Telegram Bot and WhatsApp Business API
- **AI-Powered Conversations**: Using Groq AI for natural language processing
- **Voice Support**: Text-to-speech (ElevenLabs) and speech-to-text (Whisper AI)
- **Queue Management**: BullMQ for handling high-volume requests
- **Data Persistence**: MongoDB for session and conversation storage
- **Google Sheets Integration**: Automated data processing from spreadsheets
- **Redis Caching**: Session management and performance optimization

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- Google Cloud Platform account (for Google Sheets API)
- Telegram Bot Token
- WhatsApp Business API credentials
- Groq AI API key
- ElevenLabs API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the Backend directory:
   ```env
   # AI Services
   GROQ_API_KEY=your_groq_api_key
   ELEVENLABS_API=your_elevenlabs_api_key
   
   # Telegram
   TELEGRAMBOTTOKEN=your_telegram_bot_token
   
   # WhatsApp
   WHATSAPP_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   
   # Database
   MONGO_URI=mongodb://localhost:27017/clientpulse
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PASSWORD=your_redis_password
   REDIS_PORT=6379
   REDIS_CONCURRENCY=1
   
   # Google Sheets
   SPREADSHEETID=your_spreadsheet_id
   SHEETNAME=your_sheet_name
   
   # Server
   PORT=3000
   ```

4. **Set up Google Sheets credentials**
   - Place your `GoogleSheet_API_Credentials.json` file in the `Credentials/` directory
   - Ensure the service account has access to your Google Sheets

## 🚀 Running the Application

### Quick Start
```bash
node start_application.js
```

### Individual Components

**Test all modules:**
```bash
node test_modules.js
```

**Start BullMQ workers:**
```bash
node "Bull MQ/Worker.js"
```

**Run Google Sheets handler:**
```bash
node GoogleSheet/SheetHandler.js
```

## 📊 Google Sheets Format

Your Google Sheet should have the following columns:
- A: ProductName
- B: ProductDetails  
- C: Gmail
- D: Contact
- E: UserId
- F: Status (PENDING/COMPLETED)
- G: Summary
- H: Service (TELEGRAM/WHATSAPP)
- I: UserName

## 🔧 API Endpoints

### WhatsApp Webhook
- **POST** `/whatsapp/webhook` - Receives WhatsApp messages

### Telegram Bot
- Automatically handles messages via polling

## 📁 Project Structure

```
Backend/
├── Bull MQ/
│   └── Worker.js              # Queue workers
├── Credentials/
│   └── GoogleSheet_API_Credentials.json
├── Database/
│   └── Database.js            # MongoDB connection
├── Database Schema/
│   ├── Telegram.Model.js      # Telegram session schema
│   └── Whatsapp.Model.js      # WhatsApp session schema
├── ElevenLabs/
│   └── ElevenLabs.js          # Text-to-speech service
├── GoogleSheet/
│   └── SheetHandler.js        # Google Sheets integration
├── SharedLogicAI/
│   └── SharedLogic.js         # AI conversation logic
├── Telegram/
│   └── Telegram.js            # Telegram bot implementation
├── WhisperAI/
│   └── Whisper.js             # Speech-to-text service
├── Whatsapp/
│   └── Whatsapp.js            # WhatsApp implementation
├── start_application.js       # Main application starter
├── test_modules.js            # Module testing script
└── package.json
```

## 🔍 Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check if `form-data` is installed: `npm install form-data`

2. **Database connection issues**
   - Verify MongoDB is running
   - Check `MONGO_URI` in your `.env` file

3. **Redis connection issues**
   - Verify Redis is running
   - Check Redis credentials in your `.env` file

4. **API key errors**
   - Verify all API keys are correctly set in `.env`
   - Check API key permissions and quotas

5. **Google Sheets access issues**
   - Verify the service account has access to the spreadsheet
   - Check if the spreadsheet ID and sheet name are correct

### Testing Individual Components

```bash
# Test database connection
node -e "require('./Database/Database')().then(() => console.log('DB OK')).catch(console.error)"

# Test Redis connection
node -e "const {Redis} = require('ioredis'); new Redis().ping().then(() => console.log('Redis OK')).catch(console.error)"

# Test AI services
node -e "const {intiateIntialChat} = require('./SharedLogicAI/SharedLogic'); intiateIntialChat('Test', 'Test Details', 'English', 'Test User').then(console.log).catch(console.error)"
```

## 📈 Monitoring

The application provides comprehensive logging for:
- Database operations
- API calls
- Queue processing
- Error handling
- Session management

## 🔒 Security Considerations

- Store all API keys securely in environment variables
- Use HTTPS for production deployments
- Implement rate limiting for API endpoints
- Regularly rotate API keys
- Monitor API usage and quotas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
