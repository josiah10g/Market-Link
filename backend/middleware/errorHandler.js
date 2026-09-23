const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR HANDLER]', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';


  if (err.code === '23505') {
    statusCode = 400;
    if (err.constraint && err.constraint.includes('unique_order_customer_review')) {
      message = 'You have already submitted a review for this order.';
    } else if (err.constraint && err.constraint.includes('email')) {
      message = 'An account with this email already exists.';
    } else {
      message = 'A duplicate record with unique properties already exists.';
    }
  }


  if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference: linked record does not exist or cannot be modified.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { asyncHandler, errorHandler };
