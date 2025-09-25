const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Webhook endpoint for Razorpay events
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    if (!signature) {
      console.error('Missing Razorpay signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature (skip for testing if webhook secret is placeholder)
    if (process.env.RAZORPAY_WEBHOOK_SECRET !== 'test_placeholder') {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      console.log('⚠️  Webhook signature verification skipped for testing');
    }

    const event = JSON.parse(body);
    console.log('Received Razorpay webhook event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment capture
async function handlePaymentCaptured(payment) {
  try {
    console.log('Payment captured:', payment.id);
    
    // Extract order details
    const orderId = payment.order_id;
    const amount = payment.amount / 100; // Convert from paise to rupees
    const currency = payment.currency;
    const method = payment.method;
    const email = payment.email;
    
    // Get order details from Razorpay to extract plan information
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const order = await razorpay.orders.fetch(orderId);
    const planId = order.notes?.planId;
    const userId = order.notes?.userId;
    const userEmail = order.notes?.userEmail;
    
    if (!planId || !userId) {
      console.error('Missing plan or user information in order notes');
      return;
    }
    
    // Update user subscription in database
    const subscriptionData = {
      user_id: userId,
      user_email: userEmail || email,
      plan_id: planId,
      status: 'active',
      payment_id: payment.id,
      order_id: orderId,
      amount: amount,
      currency: currency,
      payment_method: method,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert([subscriptionData], { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log('Subscription updated successfully for user:', userId);
    }
    
    // Send confirmation email (you can implement this)
    await sendConfirmationEmail(userEmail || email, planId, amount);
    
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(payment) {
  try {
    console.log('Payment failed:', payment.id);
    
    // Log the failure for monitoring
    const { error } = await supabase
      .from('payment_logs')
      .insert([{
        payment_id: payment.id,
        status: 'failed',
        amount: payment.amount / 100,
        currency: payment.currency,
        error_code: payment.error_code,
        error_description: payment.error_description,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error logging failed payment:', error);
    }
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle order paid
async function handleOrderPaid(order) {
  try {
    console.log('Order paid:', order.id);
    
    // Additional order processing logic can go here
    // For example, updating order status, sending notifications, etc.
    
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// Handle subscription activation
async function handleSubscriptionActivated(subscription) {
  try {
    console.log('Subscription activated:', subscription.id);
    
    // Update subscription status in database
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'active',
        subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', subscription.customer_id);
    
    if (error) {
      console.error('Error updating subscription status:', error);
    }
    
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

// Handle subscription charge
async function handleSubscriptionCharged(subscription) {
  try {
    console.log('Subscription charged:', subscription.id);
    
    // Log the charge and extend subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_charged_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);
    
    if (error) {
      console.error('Error updating subscription charge:', error);
    }
    
  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
  try {
    console.log('Subscription cancelled:', subscription.id);
    
    // Update subscription status
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);
    
    if (error) {
      console.error('Error updating subscription cancellation:', error);
    }
    
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

// Send confirmation email (placeholder - implement with your email service)
async function sendConfirmationEmail(email, planId, amount) {
  try {
    console.log(`Sending confirmation email to ${email} for plan ${planId} - ₹${amount}`);
    
    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, just log the action
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

module.exports = router;
