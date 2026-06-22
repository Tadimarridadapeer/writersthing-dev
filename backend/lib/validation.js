const { ValidationError } = require('./errors');

/**
 * Escapes special HTML characters to prevent XSS.
 */
function escapeXSS(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates inputs when creating or publishing a book.
 */
function validateBook(req, res, next) {
  try {
    let { title, description, genre, price } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('Book title is required and must be a non-empty string');
    }

    if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
      throw new ValidationError('Book price must be a positive number');
    }

    // Sanitize inputs to prevent stored XSS
    req.body.title = escapeXSS(title.trim());
    if (description) req.body.description = escapeXSS(description.trim());
    if (genre) req.body.genre = escapeXSS(genre.trim());

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Validates order inputs before Razorpay creation.
 */
function validatePaymentOrder(req, res, next) {
  try {
    const { bookId, amount } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!bookId || !uuidRegex.test(bookId)) {
      throw new ValidationError('Invalid or missing book ID (must be a valid UUID)');
    }

    if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
      throw new ValidationError('Payment amount must be a positive number');
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Validates Razorpay verify inputs.
 */
function validatePaymentVerify(req, res, next) {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      throw new ValidationError('Order ID is required');
    }
    if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
      throw new ValidationError('Payment ID is required');
    }
    if (!signature || typeof signature !== 'string' || signature.trim() === '') {
      throw new ValidationError('Signature is required');
    }

    // Sanitize inputs
    req.body.orderId = escapeXSS(orderId.trim());
    req.body.paymentId = escapeXSS(paymentId.trim());
    req.body.signature = escapeXSS(signature.trim());

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  escapeXSS,
  validateBook,
  validatePaymentOrder,
  validatePaymentVerify,
};
