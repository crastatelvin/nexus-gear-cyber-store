const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve public static files
app.use(express.static(path.join(__dirname, '../public')));

// Mount API routes
app.use('/api/products', productRoutes);

// Fallback for SPA routing (serve index.html for frontend routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
