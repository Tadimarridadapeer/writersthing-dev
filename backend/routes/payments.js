const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { validatePaymentOrder, validatePaymentVerify } = require('../lib/validation');
const { UnauthorizedError } = require('../lib/errors');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
router.post('/order', validatePaymentOrder, async (req, res, next) => {
  try {
    const { bookId, amount } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    const options = {
      amount: (amount || 99) * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        book_id: bookId,
        amount: amount || 99,
        razorpay_order_id: order.id,
        status: 'Pending'
      }]);

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Verify Payment
router.post('/verify', validatePaymentVerify, async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret");
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const { data: order } = await supabase
      .from('orders')
      .update({ razorpay_payment_id: paymentId, status: 'Success' })
      .eq('razorpay_order_id', orderId)
      .select()
      .single();

    if (order) {
      // Grant Library Access
      await supabase.from('library').insert([{
        user_id: order.user_id,
        book_id: order.book_id
      }]);
    }

    res.json({ message: "Payment verified" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
