# Razorpay Payment Integration Guide

This guide explains how to set up and use the Razorpay payment integration in your Resume Rank application.

## Overview

The Razorpay integration includes:

- Payment processing for subscription plans
- Webhook handling for payment events
- Subscription management in the dashboard
- Database schema for tracking payments and subscriptions

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Frontend Razorpay Key (for client-side)
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### 2. Database Setup

Run the SQL script to create the necessary tables:

```sql
-- Execute the subscription_schema.sql file in your Supabase database
-- This creates tables for user_subscriptions, payment_logs, and usage_tracking
```

### 3. Razorpay Dashboard Configuration

1. **Create a Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Get API Keys**:
   - Go to Settings > API Keys
   - Copy your Key ID and Key Secret
3. **Set up Webhooks**:
   - Go to Settings > Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhook/razorpay`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`
   - Copy the webhook secret

### 4. Install Dependencies

```bash
npm install razorpay
```

## Features

### Payment Plans

The integration includes three subscription plans:

1. **Basic Plan** - ₹999/month

   - Up to 50 resume analyses per month
   - Basic AI analysis
   - Email support

2. **Professional Plan** - ₹2,499/month

   - Up to 200 resume analyses per month
   - Advanced AI analysis with custom weights
   - Priority support
   - Export results to Excel

3. **Enterprise Plan** - ₹4,999/month
   - Unlimited resume analyses
   - Custom AI models
   - Dedicated support
   - Advanced analytics dashboard
   - API access

### API Endpoints

#### Payment API (`/api/payment/`)

- `GET /plans` - Get available pricing plans
- `POST /create-order` - Create a payment order
- `POST /verify-payment` - Verify payment signature
- `GET /payment/:paymentId` - Get payment details

#### Webhook API (`/api/webhook/`)

- `POST /razorpay` - Handle Razorpay webhook events

### Frontend Components

1. **PricingPage** (`/pricing`) - Full pricing page with plan selection
2. **PricingSection** - Pricing section for landing page
3. **PaymentModal** - Payment processing modal
4. **SubscriptionManager** - Dashboard subscription management

### Database Tables

1. **user_subscriptions** - User subscription data
2. **payment_logs** - Payment transaction logs
3. **usage_tracking** - Monthly usage tracking

## Usage

### 1. Access Pricing Page

Users can access the pricing page at `/pricing` or through the landing page pricing section.

### 2. Select a Plan

Users can select from three available plans and click "Choose Plan" to start the payment process.

### 3. Payment Processing

The payment modal will:

- Create a Razorpay order
- Open the Razorpay checkout
- Verify payment signature
- Update user subscription

### 4. Subscription Management

Users can view their subscription details in the dashboard under the "Subscription" tab.

## Security

### Payment Security

- All payments are processed securely through Razorpay
- Payment signatures are verified server-side
- Sensitive data is not stored in the frontend

### Webhook Security

- Webhook signatures are verified using HMAC-SHA256
- Only verified webhook events are processed
- Failed payments are logged for monitoring

### Database Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Sensitive payment data is properly encrypted

## Testing

### Test Mode

- Use Razorpay test keys for development
- Test cards are available in Razorpay documentation
- Webhook testing can be done using Razorpay's webhook testing tool

### Test Cards

- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

## Error Handling

The integration includes comprehensive error handling for:

- Payment failures
- Network errors
- Invalid signatures
- Database errors
- Webhook processing errors

## Monitoring

### Payment Logs

All payment attempts are logged in the `payment_logs` table for monitoring and debugging.

### Usage Tracking

User usage is tracked monthly to enforce plan limits and provide analytics.

## Support

For issues related to:

- **Razorpay Integration**: Check Razorpay documentation
- **Database Issues**: Check Supabase logs
- **Frontend Issues**: Check browser console and network tab

## Next Steps

1. Set up your Razorpay account and get API keys
2. Update environment variables
3. Run the database migration
4. Test the payment flow
5. Configure webhooks in Razorpay dashboard
6. Deploy to production

## Production Checklist

- [ ] Use production Razorpay keys
- [ ] Set up proper webhook URLs
- [ ] Configure SSL certificates
- [ ] Set up monitoring and alerts
- [ ] Test all payment scenarios
- [ ] Configure backup and recovery
