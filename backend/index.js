require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookRoutes = require('./routes/books');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/pay', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Writersthing Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
