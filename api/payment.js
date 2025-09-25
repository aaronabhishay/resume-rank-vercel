const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Pricing plans (TESTING MODE - All plans ₹1)
const PRICING_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 1, // ₹1 for testing
    currency: 'INR',
    description: 'Perfect for small teams',
    features: [
      'Up to 50 resume analyses per month',
      'Basic AI analysis',
      'Email support',
      'Standard processing speed'
    ],
    limits: {
      monthlyAnalyses: 50,
      concurrentJobs: 2
    }
  },
  professional: {
    name: 'Professional Plan',
    price: 1, // ₹1 for testing
    currency: 'INR',
    description: 'Ideal for growing companies',
    features: [
      'Up to 200 resume analyses per month',
      'Advanced AI analysis with custom weights',
      'Priority support',
      'Faster processing',
      'Export results to Excel'
    ],
    limits: {
      monthlyAnalyses: 200,
      concurrentJobs: 5
    }
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 1, // ₹1 for testing
    currency: 'INR',
    description: 'For large organizations',
    features: [
      'Unlimited resume analyses',
      'Custom AI models',
      'Dedicated support',
      'Fastest processing',
      'Advanced analytics dashboard',
      'API access',
      'Custom integrations'
    ],
    limits: {
      monthlyAnalyses: -1, // Unlimited
      concurrentJobs: 10
    }
  }
};

// Get pricing plans
router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      plans: PRICING_PLANS
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing plans'
    });
  }
});

// Create payment order
router.post('/create-order', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    if (!planId || !PRICING_PLANS[planId]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    const plan = PRICING_PLANS[planId];
    const amount = plan.price * 100; // Convert to paise

    const options = {
      amount: amount,
      currency: plan.currency,
      receipt: `receipt_${Date.now().toString().slice(-8)}`,
      notes: {
        planId: planId,
        userId: userId,
        userEmail: userEmail,
        planName: plan.name
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      plan: {
        id: planId,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        features: plan.features
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

// Verify payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, paymentId, signature, planId, userId, userEmail } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification data'
      });
    }

    // Verify the payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        error: 'Payment not captured'
      });
    }

    // Here you would typically:
    // 1. Update user's subscription in your database
    // 2. Send confirmation email
    // 3. Log the transaction

    res.json({
      success: true,
      payment: {
        id: paymentId,
        orderId: orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at
      },
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at,
        orderId: payment.order_id
      }
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
});

// Get current subscription
router.get('/subscription/current', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    // For now, return a default free plan
    // In production, you'd query your database
    res.json({
      plan: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: null,
      monthlyAnalyses: 10,
      usedAnalyses: 0,
      remainingAnalyses: 10
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

// Get usage data
router.get('/subscription/usage', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    // For now, return default usage data
    // In production, you'd query your database for actual usage
    res.json({
      thisMonth: 0,
      lastMonth: 0,
      totalAnalyses: 0
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage data'
    });
  }
});

// Webhook endpoint for Razorpay events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        // Update user subscription status
        // Send confirmation email
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        // Handle failed payment
        break;
      
      case 'order.paid':
        console.log('Order paid:', event.payload.order.entity.id);
        // Handle successful order
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
