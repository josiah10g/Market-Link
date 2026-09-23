const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');

const path = require('path');
dotenv.config();
// Also attempt loading backend/.env if running from workspace root
dotenv.config({ path: path.join(__dirname, '.env') });

// Process-level crash prevention guards for production cloud environments (Railway)
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

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
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Root & Health check endpoints for Railway / cloud monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'MarketLink API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'online', platform: 'MarketLink API' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'MarketLink API',
    database: 'PostgreSQL / Supabase',
    timestamp: new Date().toISOString()
  });
});

// Quick Email Diagnostic Endpoint
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.to || process.env.SMTP_USER;
  if (!targetEmail) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a recipient email query param: /api/test-email?to=your_email@gmail.com'
    });
  }

  try {
    const { getTransporter } = require('./utils/emailService');
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"MarketLink" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: 'MarketLink Nodemailer Test Email',
      text: 'Hello from MarketLink! Your Nodemailer SMTP setup is working perfectly.',
      html: `
        <div style="font-family: sans-serif; background-color: #0E1311; color: #E8EDE9; padding: 28px; border-radius: 8px; border: 1px solid #1E2724; max-width: 500px;">
          <h2 style="color: #B9FF66; margin-top: 0;">MarketLink Nodemailer Test</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #8C9992;">
            Congratulations! If you are reading this email, your Nodemailer credentials and SMTP connection are configured correctly and active.
          </p>
          <div style="margin-top: 20px; padding: 12px 16px; background-color: #171F1C; border-left: 3px solid #B9FF66; border-radius: 4px; font-size: 13px;">
            <strong>Recipient:</strong> ${targetEmail}<br/>
            <strong>Timestamp:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}!`,
      messageId: info.messageId || 'sent'
    });
  } catch (err) {
    console.error('[TEST EMAIL ERROR]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: err.message
    });
  }
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
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  // Initialize email transporter on boot to verify SMTP connection immediately
  try {
    const { getTransporter } = require('./utils/emailService');
    getTransporter();
  } catch (emailInitErr) {
    console.warn('[SERVER] Email service boot check notice:', emailInitErr.message);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[SERVER] MarketLink API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (bound to ${HOST})`);
  });
}

module.exports = app;
