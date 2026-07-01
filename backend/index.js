require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bookRoutes = require('./routes/books');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting Setup
const rateLimit = require('express-rate-limit');

// General API Rate Limiter (Max 100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again after 15 minutes' }
});

// Stricter Rate Limiter for payment endpoints (Max 10 operations per hour per IP)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests from this IP. Please try again later.' }
});

// Apply rate limiters
app.use('/api/pay', paymentLimiter);
app.use('/api/', apiLimiter);

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/pay', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Writersthing Backend API is running...');
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred';

  res.status(statusCode).json({
    error: message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
