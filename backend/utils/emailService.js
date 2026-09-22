const nodemailer = require('nodemailer');
const db = require('../config/db');

/**
 * Configure Nodemailer Transporter
 * Supports Gmail, Custom SMTP, Ethereal Test Account, or Mailtrap
 */
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: { user, pass }
    });
  } else {
    // Development / fallback logger transporter when credentials aren't set yet
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n========================================');
        console.log(`[NODEMAILER SIMULATION] To: ${mailOptions.to}`);
        console.log(`[NODEMAILER SIMULATION] Subject: ${mailOptions.subject}`);
        console.log(`[NODEMAILER SIMULATION] Text snippet: ${mailOptions.text ? mailOptions.text.slice(0, 140) : 'HTML body rendered'}`);
        console.log('========================================\n');
        return { messageId: 'simulated-' + Date.now() };
      }
    };
  }

  return transporter;
};

/**
 * Modern dark-mode editorial HTML email wrapper matching MarketLink design
 */
const renderEmailTemplate = ({ title, preheader, bodyHtml, ctaText, ctaUrl }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0B0F0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #EDEFEC; }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #121816; border: 1px solid #232D29; border-radius: 8px; overflow: hidden; }
        .header { padding: 32px 28px 24px; text-align: left; border-bottom: 1px solid #232D29; background-color: #171F1C; }
        .logo { font-size: 20px; font-weight: 700; color: #EDEFEC; text-decoration: none; letter-spacing: -0.02em; }
        .logo span { color: #B9FF66; }
        .content { padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #B4BFB7; }
        .content h1 { margin-top: 0; font-size: 22px; font-weight: 600; color: #EDEFEC; }
        .btn-cta { display: inline-block; padding: 12px 24px; background-color: #B9FF66; color: #0B0F0E; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 4px; margin: 24px 0 16px; }
        .footer { padding: 24px 28px; text-align: center; font-size: 12px; color: #8B978F; border-top: 1px solid #232D29; background-color: #0B0F0E; }
      </style>
    </head>
    <body>
      <div style="padding: 24px 12px;">
        <div class="wrapper">
          <div class="header">
            <span class="logo">Market<span>Link</span></span>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${bodyHtml}
            ${ctaText && ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="btn-cta">${ctaText}</a></div>` : ''}
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px;">MarketLink — Multi-Vendor Digital Economy Platform</p>
            <p style="margin: 0; color: #627068;">Plot 204, Shehu Shagari Way, Garki II, Abuja, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatch an email safely using Nodemailer
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = getTransporter();
    const fromAddress = process.env.SMTP_FROM || `MarketLink <${process.env.SMTP_USER || 'no-reply@marketlink.ng'}>`;
    
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || subject,
      html
    });

    console.log(`[NODEMAILER] Email sent to "${to}" | Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[NODEMAILER ERROR] Failed to send email to', to, ':', err.message);
    return null;
  }
};

/**
 * Order Confirmation Email to Customer
 */
const sendOrderConfirmationEmail = async ({ customerEmail, customerName, orderCode, vendorName, totalAmount, paymentMethod, deliveryAddress, items }) => {
  if (!customerEmail) return;

  const itemsHtml = (items || []).map(it => `
    <tr style="border-bottom: 1px solid #232D29;">
      <td style="padding: 10px 0; color: #EDEFEC;">${it.product_name || it.name} × ${it.quantity}</td>
      <td style="padding: 10px 0; text-align: right; color: #B9FF66; font-weight: 600;">₦${(Number(it.price) * it.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const bodyHtml = `
    <p>Hi ${customerName || 'there'},</p>
    <p>Your order <strong>#${orderCode}</strong> has been successfully placed with <strong>${vendorName}</strong>.</p>
    
    <div style="background-color: #171F1C; border: 1px solid #232D29; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${itemsHtml}
        <tr>
          <td style="padding-top: 14px; font-weight: 600; color: #EDEFEC;">Total Amount</td>
          <td style="padding-top: 14px; text-align: right; font-weight: 700; color: #B9FF66; font-size: 16px;">₦${Number(totalAmount).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #8B978F; margin-bottom: 6px;">
      <strong>Payment Method:</strong> ${paymentMethod === 'paystack' ? 'Paystack (Paid Online)' : 'Pay on Delivery'}
    </p>
    <p style="font-size: 13px; color: #8B978F; margin-top: 0;">
      <strong>Delivery Destination:</strong> ${deliveryAddress}
    </p>
  `;

  const html = renderEmailTemplate({
    title: `Order Confirmed #${orderCode}`,
    bodyHtml,
    ctaText: 'Track Your Order',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`
  });

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmed: #${orderCode} - MarketLink`,
    html
  });
};

/**
 * New Order Alert Email to Vendor
 */
const sendVendorNewOrderEmail = async ({ vendorEmail, vendorBusinessName, customerName, orderCode, totalAmount, items }) => {
  if (!vendorEmail) return;

  const bodyHtml = `
    <p>Hi ${vendorBusinessName},</p>
    <p>You have received a new order <strong>#${orderCode}</strong> from <strong>${customerName || 'a customer'}</strong>!</p>

    <div style="background-color: #171F1C; border: 1px solid #232D29; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #EDEFEC;">Order Value: <strong style="color: #B9FF66; font-size: 16px;">₦${Number(totalAmount).toLocaleString()}</strong></p>
      <p style="margin: 0; font-size: 13px; color: #8B978F;">Total items: ${(items || []).reduce((s, i) => s + i.quantity, 0)}</p>
    </div>

    <p>Please log in to your vendor dashboard to accept and begin preparing this order.</p>
  `;

  const html = renderEmailTemplate({
    title: `New Order Received #${orderCode}`,
    bodyHtml,
    ctaText: 'View in Vendor Dashboard',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/orders`
  });

  return sendEmail({
    to: vendorEmail,
    subject: `New Order Received: #${orderCode} - MarketLink`,
    html
  });
};

/**
 * Order Status Update Email to Customer
 */
const sendOrderStatusEmail = async ({ customerEmail, customerName, orderCode, vendorName, newStatus }) => {
  if (!customerEmail) return;

  const statusDescriptions = {
    accepted: `Your order has been accepted by ${vendorName} and will be prepared soon.`,
    in_progress: `${vendorName} is now actively preparing your items!`,
    ready: `Your items are ready for pickup/delivery!`,
    completed: `Your order has been completed! Thank you for ordering on MarketLink. Please consider leaving a review.`,
    cancelled: `Your order was cancelled.`
  };

  const bodyHtml = `
    <p>Hi ${customerName || 'there'},</p>
    <p>${statusDescriptions[newStatus] || `The status of your order #${orderCode} has been updated to "${newStatus.replace('_', ' ')}".`}</p>
    <div style="padding: 12px 16px; background-color: #171F1C; border-left: 3px solid #B9FF66; border-radius: 4px; margin: 18px 0; font-size: 14px; color: #EDEFEC;">
      Current Status: <strong style="text-transform: uppercase; color: #B9FF66;">${newStatus.replace('_', ' ')}</strong>
    </div>
  `;

  const html = renderEmailTemplate({
    title: `Order Update #${orderCode}: ${newStatus.toUpperCase()}`,
    bodyHtml,
    ctaText: 'Check Order Status',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`
  });

  return sendEmail({
    to: customerEmail,
    subject: `Order #${orderCode} Status: ${newStatus.toUpperCase()} - MarketLink`,
    html
  });
};

/**
 * Welcome Email for New Signups
 */
const sendWelcomeEmail = async ({ email, name, role }) => {
  if (!email) return;

  const bodyHtml = `
    <p>Welcome to MarketLink, ${name}!</p>
    <p>Your account as a <strong>${role}</strong> is ready. Connect directly with verified Abuja storefronts, artisan producers, and fast local delivery.</p>
  `;

  const html = renderEmailTemplate({
    title: `Welcome to MarketLink, ${name}`,
    bodyHtml,
    ctaText: role === 'vendor' ? 'Go to Store Dashboard' : 'Start Exploring Products',
    ctaUrl: role === 'vendor' ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor` : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/products`
  });

  return sendEmail({
    to: email,
    subject: `Welcome to MarketLink, ${name}!`,
    html
  });
};

/**
 * Creates in-app notification and dispatches real email
 */
const createNotification = async (clientOrDb, { userId, orderId, type, title, message, userEmail, userName }) => {
  const executor = clientOrDb || db;
  try {
    const { rows } = await executor.query(
      `INSERT INTO notifications (user_id, order_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, orderId || null, type, title, message]
    );

    // If userEmail was passed or user exists, send email
    let recipientEmail = userEmail;
    if (!recipientEmail && userId) {
      try {
        const uRes = await executor.query('SELECT email, name FROM users WHERE id = $1', [userId]);
        if (uRes.rows.length > 0) {
          recipientEmail = uRes.rows[0].email;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (recipientEmail) {
      const html = renderEmailTemplate({
        title,
        bodyHtml: `<p>${message}</p>`,
        ctaText: 'Open MarketLink',
        ctaUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      });

      sendEmail({
        to: recipientEmail,
        subject: `${title} - MarketLink`,
        html,
        text: message
      }).catch(err => console.warn('[EMAIL WARNING]', err.message));
    }

    return rows[0];
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err.message);
    return null;
  }
};

module.exports = {
  getTransporter,
  sendEmail,
  sendOrderConfirmationEmail,
  sendVendorNewOrderEmail,
  sendOrderStatusEmail,
  sendWelcomeEmail,
  createNotification
};

