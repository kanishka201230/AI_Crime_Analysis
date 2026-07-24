const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_REGISTER_PASSWORD = process.env.ADMIN_REGISTER_PASSWORD || 'CrimeAdmin@2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting for Admin Verification to prevent brute-force attacks
const rateLimit = require('express-rate-limit');
const adminVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 failed verification requests per windowMs
  skipSuccessfulRequests: true, // Successful password verification doesn't count against limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many verification attempts. Please try again after 15 minutes.'
    });
  }
});

/**
 * @route   POST /api/verify-admin-registration
 * @desc    Securely verify admin registration password against environment variables
 * @access  Public (Rate-limited)
 */
app.post('/api/verify-admin-registration', adminVerifyLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Incorrect Admin Password'
      });
    }

    const inputBuf = Buffer.from(password);
    const targetBuf = Buffer.from(ADMIN_REGISTER_PASSWORD);

    let isMatch = false;
    // Perform timing-safe comparison to prevent timing side-channel attacks
    if (inputBuf.length === targetBuf.length) {
      isMatch = crypto.timingSafeEqual(inputBuf, targetBuf);
    }

    if (isMatch) {
      return res.status(200).json({
        success: true,
        message: 'Admin verification successful.'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Admin Password'
      });
    }
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal verification error.'
    });
  }
});

const llmService = require('./llmService');

/**
 * @route   POST /api/chat
 * @desc    LLM AI Investigator Copilot Endpoint (Supports Gemini, OpenAI, Ollama, and Fallback)
 * @access  Public
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message string is required.'
      });
    }

    const responseText = await llmService.generateResponse(message, history || []);

    return res.status(200).json({
      success: true,
      response: responseText,
      provider: process.env.LLM_PROVIDER || 'gemini',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling chat API request:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while generating AI response.',
      details: error.message
    });
  }
});

// Serve static frontend files
app.use(express.static(__dirname));

// Fallback to index.html for any unhandled routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server with Port Fallback handling
const startServer = (portToTry) => {
  const server = app.listen(portToTry, () => {
    console.log(`====================================================`);
    console.log(` AegisEye Tactical Backend Server Active`);
    console.log(` Running on: http://localhost:${portToTry}`);
    console.log(` Admin Reg Endpoint: POST /api/verify-admin-registration`);
    console.log(` AI Chat Endpoint:  POST /api/chat`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Warning] Port ${portToTry} is already in use. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(Number(PORT));
