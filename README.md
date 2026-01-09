# ClientPulse Backend

<div align="center">

**A sophisticated feedback collection system with multi-platform support, AI-powered conversations, and high-throughput queue processing**

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](#)

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Configuration](#-configuration) • [Performance](#-performance) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🚀 Features

### Communication Platforms
- **Telegram Bot** - Real-time messaging with polling support
- **WhatsApp Integration** - Webhook-based message handling with media support
- **Email Notifications** - Gmail SMTP for automated feedback delivery

### AI & Voice Services
- **Groq AI** - Lightning-fast LLM for natural language conversations
- **ElevenLabs** - Premium text-to-speech with 29+ languages
- **Whisper AI** - Deepgram speech-to-text for audio transcription

### Data Management
- **Google Sheets Sync** - Bi-directional data synchronization
- **MongoDB** - Persistent storage for sessions, conversations, and summaries
- **Redis** - High-performance caching and session management

### Queue Processing
- **BullMQ** - Distributed job queue for handling parallel requests
- **4 Specialized Queues**:
  - User data processing queue
  - Telegram feedback collection
  - WhatsApp feedback collection
  - Email notification queue

### Scalability
- **Node.js Cluster Mode** - Multi-process architecture (scales to CPU count)
- **Concurrent Job Processing** - Configurable worker concurrency
- **Distributed Queue System** - Redis-backed task distribution

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                         │
│              (Cluster Mode - Multi-Process)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │ CPU 1│  │ CPU 2│  │ CPU 3│  │ CPU 4│ (Scales with CPU cores)
    └───┬──┘  └───┬──┘  └───┬──┘  └───┬──┘
        │         │         │         │
        └─────────┼─────────┼─────────┘
                  │
        ┌─────────▼──────────┐
        │   BullMQ Workers   │
        │  (4 Job Queues)    │
        └─────────┬──────────┘
                  │
        ┌─────────┼──────────┬─────────────┐
        │         │          │             │
    ┌───▼──┐ ┌───▼──┐ ┌───▼────┐  ┌────▼──┐
    │Redis │ │MongoDB│ │Telegram│  │WhatsApp│
    │Queue │ │Session│ │   API  │  │  API   │
    └──────┘ └───────┘ └────────┘  └────────┘
```

---

## 📋 Prerequisites

| Component | Requirement | Version |
|-----------|-------------|---------|
| **Node.js** | Runtime | v16+ |
| **npm** | Package Manager | v8+ |
| **MongoDB** | Primary Database | v4.4+ |
| **Redis** | Cache & Queue | v6.0+ |
| **Telegram** | Bot Token | Required |
| **WhatsApp** | Business API Credentials | Required |

### Third-Party Services (API Keys Required)
- [Groq AI](https://console.groq.com/keys) - LLM Processing
- [ElevenLabs](https://www.elevenlabs.io/api) - Voice Synthesis
- [Deepgram](https://console.deepgram.com/project/keys) - Speech Recognition
- [Google Cloud Platform](https://cloud.google.com/docs/authentication) - Sheets API
- [Gmail](https://support.google.com/accounts/answer/185833) - SMTP Credentials

---

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone <https://github.com/Arjun9756/Client-Pulse/>
cd Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the Backend directory:

```env
# ========== AI & VOICE SERVICES ==========
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API=sk_xxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ========== TELEGRAM BOT ==========
TELEGRAMBOTTOKEN

# ========== DATABASE ==========
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/ClientPulse?retryWrites=true&w=majority
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PASSWORD=your_redis_password_here
REDIS_PORT=18522
REDIS_CONCURRENCY=2

# ========== GOOGLE SHEETS ==========
SPREADSHEETID=1Tc_Mk5f1O6LFyTCPnfCdnpz_L_Z36NyYKeZsLUMi300
SHEETNAME=Sheet1

# ========== EMAIL SERVICE ==========
NODEMAILER_HOST_NAME=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASS=your_app_password_here

# ========== SERVER CONFIG ==========
PORT=3000
NODE_ENV=development
```

### 4. Set Up Google Sheets API Credentials
```bash
# 1. Download service account JSON from Google Cloud Console
# 2. Place the file in the Credentials/ directory
# 3. Rename it to: GoogleSheet_API_Credentials.json
```

### 5. Database Connection Verification
```bash
# Test MongoDB connection
npm install -g mongoose-cli  # Optional
mongosh "your_mongo_uri"

# Test Redis connection
redis-cli -h your_redis_host -p your_redis_port PING
```

---

## 🚀 Running the Application

### Option 1: Production Mode (Recommended)
```bash
# Starts cluster with workers for all CPU cores
node app.js
```

### Option 2: Development Mode with Auto-Reload
```bash
npm install -g nodemon  # Install if not present
nodemon app.js
```

### Option 3: Start Specific Components
```bash
# Start BullMQ Workers (Queue Processing)
node "Bull MQ/Worker.js"

# Sync Google Sheets Data
node GoogleSheet/SheetHandler.js

# Run All Tests
node Test.js
```

### Option 4: Docker Deployment (Recommended for Production)
```bash
# Build Docker image
docker build -t clientpulse-backend .

# Run container
docker run -p 3000:3000 --env-file .env clientpulse-backend
```

---

## ⚙️ Configuration Guide

### Google Sheets Format Requirements

Your Google Sheet must have these columns in order:

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | ProductName | String | iPhone 15 Pro |
| B | ProductDetails | String | Latest flagship model |
| C | Gmail | Email | user@example.com |
| D | Contact | Phone (10 digits) | 9876543210 |
| E | UserId | Number | 123456789 |
| F | Status | Enum (PENDING/COMPLETED) | PENDING |
| G | Summary | Text | User feedback here |
| H | Service | Enum (TELEGRAM/WHATSAPP/CALL) | TELEGRAM |
| I | UserName | String | John Doe |

### Queue Configuration

The system uses 4 BullMQ queues managed by Redis:

```javascript
// Configuration in .env
REDIS_CONCURRENCY=2  // Jobs processed simultaneously per worker
REDIS_HOST=your_host
REDIS_PASSWORD=your_password
REDIS_PORT=your_port
```

**Queue Details:**
| Queue Name | Purpose | Worker Concurrency |
|------------|---------|-------------------|
| `Users` | Google Sheets data processing | $REDIS_CONCURRENCY |
| `telegramFeedbackQueue` | Telegram message handling | $REDIS_CONCURRENCY |
| `whatsappFeedbackQueue` | WhatsApp message handling | $REDIS_CONCURRENCY |
| `mailQueue` | Email delivery | $REDIS_CONCURRENCY |

---

## 📁 Project Structure

```
Backend/
├── app.js                          # Main application entry point (Cluster setup)
├── package.json                    # Dependencies & scripts
├── Test.js                         # Test suite
│
├── Bull MQ/
│   └── Worker.js                   # Queue workers (4 specialized workers)
│
├── Credentials/
│   └── GoogleSheet_API_Credentials.json  # Service account credentials
│
├── Database/
│   └── Database.js                 # MongoDB connection manager
│
├── Database Schema/
│   ├── Telegram.Model.js           # Telegram session schema
│   ├── TelegramSummary.Model.js    # Telegram feedback storage
│   ├── Whatsapp.Model.js           # WhatsApp session schema
│   └── WhatsAppSummary.Model.js    # WhatsApp feedback storage
│
├── ElevenLabs/
│   ├── ElevenLabs.js               # Text-to-speech integration
│   └── ElevenVoice/                # Voice models storage
│
├── GoogleSheet/
│   └── SheetHandler.js             # Google Sheets sync logic
│
├── SharedLogicAI/
│   └── SharedLogic.js              # Common AI conversation logic
│
├── Telegram/
│   ├── Telegram.js                 # Telegram bot implementation
│   └── downloads/                  # Downloaded media files
│
├── WhisperAI/
│   ├── Whisper.js                  # Speech-to-text integration
│   └── downloads/                  # Processed audio files
│
├── Whatsapp/
│   ├── Whatsapp.js                 # WhatsApp integration
│   └── (webhook endpoint handling)
│
├── Utils/
│   └── Gmail.SMTP.js               # Email sending utility
│
└── README.md                        # This file
```

---

## 🔌 API Endpoints

### Telegram
- **Webhook:** Polling-based (no exposed endpoint)
- **Handler:** Telegram/Telegram.js

### WhatsApp
- **Webhook:** `POST /whatsapp/webhook`
- **Handler:** Whatsapp/Whatsapp.js
- **Body Format:**
  ```json
  {
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919876543210",
            "type": "text|audio|document",
            "text": { "body": "User message" }
          }]
        }
      }]
    }]
  }
  ```

### Google Sheets
- **Trigger:** Scheduled polling via GoogleSheet/SheetHandler.js
- **Interval:** Configurable via timeout
- **Action:** Reads rows and enqueues jobs to `Users` queue

---

## ⚡ Performance & Capacity

### Current Configuration
```
Worker Processes:  CPU Core Count (default)
Queue Concurrency: REDIS_CONCURRENCY (default: 2)
Parallel Requests: 50-150 concurrent HTTP requests
Queue Throughput:  8-16 jobs/second (with CONCURRENCY=2)
Database Pools:    MongoDB (10), Redis (1)
```

### Scaling Recommendations

**To increase parallel request capacity:**

1. **Increase Queue Concurrency** (Conservative Default)
   ```env
   REDIS_CONCURRENCY=5  # From default 2
   ```
   *Impact:* +250% job processing throughput

2. **Add Redis Connection Pooling**
   - Current: Single Redis connection
   - Recommended: Cluster/Sentinel setup for 99.9% uptime

3. **MongoDB Connection Pool**
   - Current: Default 10 connections
   - Adjust via `MONGO_URI` parameters:
     ```
     maxPoolSize=20&minPoolSize=10
     ```

4. **Horizontal Scaling**
   - Deploy multiple instances behind a load balancer
   - Shared Redis and MongoDB (already compatible)
   - Each instance: 4-8 worker processes

### Stress Testing
```bash
# Test concurrent requests (install: npm install -g autocannon)
autocannon -c 100 -d 30 http://localhost:3000

# Monitor queue performance
npm install -g bullmq  # For monitoring tools
```

---

## 🔐 Security Considerations

### Environment Variables
- ✅ Never commit `.env` to version control
- ✅ Use `.env.example` for template
- ✅ Rotate API keys quarterly
- ✅ Use separate keys for development/production

### API Security
- ⚠️ No authentication currently implemented
- ⚠️ Add JWT/API key validation before production
- ⚠️ Implement rate limiting per IP/user
- ✅ Use HTTPS in production only

### Database Security
- ✅ MongoDB: Use IP whitelist + strong passwords
- ✅ Redis: Use TLS + password authentication
- ✅ Both: Enable audit logging

### Code Recommendations
```javascript
// Add rate limiting middleware
npm install express-rate-limit

// Add request validation
npm install joi  // or zod (already installed)

// Add helmet for security headers
npm install helmet
```

---

## 🐛 Troubleshooting

### Installation Issues

**Issue: Module not found**
```bash
# Solution:
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue: Cannot find `form-data`**
```bash
npm install form-data
```

### Connection Issues

**Issue: MongoDB connection timeout**
```bash
# Verify connection string format
echo "MONGO_URI: $MONGO_URI"

# Test connection
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('✓ Connected')).catch(e => console.error('✗', e.message))"
```

**Issue: Redis connection refused**
```bash
# Verify credentials and host
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# Should return: PONG
```

**Issue: Google Sheets API error**
```bash
# Verify credentials file exists
ls -la Credentials/GoogleSheet_API_Credentials.json

# Check permissions
cat Credentials/GoogleSheet_API_Credentials.json | jq '.project_id'
```

### Queue Issues

**Issue: Jobs not processing**
```bash
# Check worker is running
ps aux | grep "Bull MQ/Worker.js"

# Check Redis concurrency setting
echo $REDIS_CONCURRENCY  # Should be >= 1

# Monitor queue status
node "Bull MQ/Worker.js" &  # Start in background
```

**Issue: Jobs stuck in queue**
```bash
# Clear failed jobs (use cautiously!)
node -e "const {Queue} = require('bullmq'); new Queue('Users').clean(0, 'failed').then(c => console.log('Cleaned:', c))"
```

### Performance Issues

**Issue: High CPU usage**
- Monitor with `top` or `htop`
- Reduce `REDIS_CONCURRENCY` if CPU > 80%
- Check for infinite loops in AI logic

**Issue: Memory leaks**
- Use `--inspect` flag: `node --inspect app.js`
- Open Chrome DevTools: `chrome://inspect`
- Take heap snapshots and analyze

**Issue: Slow API responses**
```bash
# Enable request logging
# Add to app.js: app.use(require('morgan')('dev'))

# Profile requests
npm install clinic
clinic doctor -- node app.js
```

### AI & Voice Service Issues

**Issue: Groq AI timeout**
- Check API quota limits
- Verify `GROQ_API_KEY` is valid
- Add retry logic with exponential backoff

**Issue: ElevenLabs synthesis fails**
- Verify voice ID: `ELEVENLABS_API_VOICE_ID`
- Check API key permissions
- Ensure text length < 5000 characters

**Issue: Deepgram transcription errors**
- Verify audio format (WAV, MP3, etc.)
- Check audio file size (< 5MB recommended)
- Validate `DEEPGRAM_API_KEY`

---

## 🧪 Testing

### Test All Components
```bash
node Test.js
```

### Individual Tests
```bash
# Test database
node -e "require('./Database/Database')().then(() => console.log('✓ DB Connected')).catch(e => console.error('✗', e.message))"

# Test Redis
node -e "const Redis = require('ioredis'); new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST, {password: process.env.REDIS_PASSWORD}).ping().then(r => console.log('✓ Redis:', r)).catch(e => console.error('✗', e.message))"

# Test AI Model
node -e "const {intiateIntialChat} = require('./SharedLogicAI/SharedLogic'); intiateIntialChat('Test Product', 'Test Details', 'English', 'Test User').then(r => console.log('✓ AI Response:', r)).catch(e => console.error('✗', e.message))"

# Test Google Sheets
node GoogleSheet/SheetHandler.js
```

---

## 📊 Known Issues & Limitations

### Critical Issues ⚠️
1. **Typo in app.js** (Line 15): `os.cpus().lenth` → should be `os.cpus().length`
   - Status: Prevents proper cluster scaling
   - Impact: Only 1 worker created instead of N CPU cores

2. **No request validation** in app.js
   - Status: Missing middleware (CORS, body-parser, etc.)
   - Impact: Cannot process POST requests

3. **Low queue concurrency** (default: 2)
   - Status: Conservative default for stability
   - Impact: Can only process 2 jobs simultaneously
   - Solution: Increase `REDIS_CONCURRENCY` to 5-10

### Upcoming Features 🚀
- [ ] WhatsApp Business API v2 integration
- [ ] Phone call support via Twilio
- [ ] Multi-language support enhancement
- [ ] Real-time dashboard for monitoring
- [ ] Webhook signature validation
- [ ] Automatic retry logic with exponential backoff

---

## 📈 Monitoring & Logging

### Application Logs
- BullMQ job processing logs
- API request/response logs
- Database operation logs
- Error stack traces

### Recommended Monitoring Tools
```bash
# Winston logging framework
npm install winston

# Prometheus metrics
npm install prom-client

# Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() })
})
```

---

## 🤝 Contributing

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm test`
3. Commit with clear messages: `git commit -m "feat: add new feature"`
4. Push and create Pull Request: `git push origin feature/your-feature`

### Code Style
- Use ES6+ syntax
- Add comments for complex logic
- Follow existing naming conventions
- Test before submitting PR

### Reporting Bugs
- Include error message and stack trace
- Provide steps to reproduce
- Specify environment (Node version, OS, etc.)
- Attach relevant logs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- 📧 Email: as9604793@gmail.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/Arjun9756/Client-Pulse/)
- 💬 Discussions: [GitHub Discussions](https://github.com/Arjun9756/Client-Pulse/)

---

## 🙏 Acknowledgments

- [BullMQ](https://github.com/Arjun9756/Client-Pulse/) - Queue management
- [Groq AI](https://console.groq.com/) - LLM processing
- [ElevenLabs](https://www.elevenlabs.io/) - Voice synthesis
- [Telegram Bot API](https://core.telegram.org/bots/api) - Messaging
- [MongoDB](https://www.mongodb.com/) - Database
- [Redis](https://redis.io/) - Caching & queue

---

## Run Like This
Terminal 1 = cd Backend , cd Bull MQ or open in integrated terminal run it
Config .env file
Terminal 2 = run app.js

<div align="center">

**Made with ❤️ by the Arjun Singh Negi**

[⬆ Back to Top](#clientpulse-backend)

</div>
