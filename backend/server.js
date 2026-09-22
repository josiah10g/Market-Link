const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'MarketLink API',
    database: 'PostgreSQL / Supabase',
    timestamp: new Date().toISOString()
  });
});

// Live Platform Public Stats endpoint (Real-time Supabase count)
app.get('/api/platform/stats', async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    if (!supabase) {
      return res.json({ success: true, vendors: 0, orders: 0, rating: null });
    }

    const [{ count: vendorCount }, { count: orderCount }] = await Promise.all([
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ]);

    // Average rating
    const { data: ratingData } = await supabase.from('vendors').select('rating').not('rating', 'is', null);
    let avgRating = null;
    if (ratingData && ratingData.length > 0) {
      const sum = ratingData.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
      avgRating = (sum / ratingData.length).toFixed(1);
    }

    res.json({
      success: true,
      vendors: vendorCount || 0,
      orders: orderCount || 0,
      rating: avgRating
    });
  } catch (err) {
    res.json({ success: true, vendors: 0, orders: 0, rating: null });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found` });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SERVER] MarketLink API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
