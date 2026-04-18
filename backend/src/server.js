require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// CORS – allow frontend dev server and production Vercel URL
const allowedOrigins = [
  process.env.CLIENT_URL,           // Set this to your Vercel URL in production
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/skills',       require('./routes/skills'));
app.use('/api/recruiter',    require('./routes/recruiter'));
app.use('/api/contact',      require('./routes/contact'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/payment',      require('./routes/payment'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'ProCred API running 🚀', timestamp: new Date() })
);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) =>
  res.status(404).json({ success: false, message: 'API route not found' })
);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ProCred server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`   MongoDB     : ${process.env.MONGO_URI ? 'configured ✅' : '⚠️  MONGO_URI not set!'}`);
});
