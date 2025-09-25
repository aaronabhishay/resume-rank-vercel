// Razorpay configuration and utilities
export const RAZORPAY_CONFIG = {
  key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key', // You'll need to set this in your environment
  currency: 'INR',
  name: 'Resume Rank',
  description: 'AI-Powered Resume Analysis Service',
  theme: {
    color: '#3B82F6',
  },
  prefill: {
    email: '',
    name: '',
  },
  notes: {
    address: 'Resume Rank Office',
  },
  modal: {
    ondismiss: function() {
      console.log('Payment modal closed');
    }
  }
};

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create Razorpay instance
export const createRazorpayInstance = (options) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay not loaded');
  }
  return new window.Razorpay(options);
};

// Payment utility functions
export const paymentUtils = {
  // Format amount for display
  formatAmount: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  // Format amount for Razorpay (convert to paise)
  formatAmountForRazorpay: (amount) => {
    return Math.round(amount * 100);
  },

  // Validate payment response
  validatePaymentResponse: (response) => {
    const requiredFields = ['razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature'];
    return requiredFields.every(field => response[field]);
  },

  // Get plan details
  getPlanDetails: (planId) => {
    const plans = {
      basic: {
        name: 'Basic Plan',
        price: 999,
        features: ['Up to 50 resume analyses per month', 'Basic AI analysis', 'Email support'],
        limits: { monthlyAnalyses: 50, concurrentJobs: 2 }
      },
      professional: {
        name: 'Professional Plan',
        price: 2499,
        features: ['Up to 200 resume analyses per month', 'Advanced AI analysis', 'Priority support'],
        limits: { monthlyAnalyses: 200, concurrentJobs: 5 }
      },
      enterprise: {
        name: 'Enterprise Plan',
        price: 4999,
        features: ['Unlimited resume analyses', 'Custom AI models', 'Dedicated support'],
        limits: { monthlyAnalyses: -1, concurrentJobs: 10 }
      }
    };
    return plans[planId] || null;
  }
};

// Error messages
export const PAYMENT_ERRORS = {
  INVALID_AMOUNT: 'Invalid payment amount',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_RESPONSE: 'Invalid payment response',
  USER_CANCELLED: 'Payment was cancelled by user',
  SIGNATURE_VERIFICATION_FAILED: 'Payment verification failed',
  ORDER_NOT_FOUND: 'Order not found',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  CARD_DECLINED: 'Card was declined',
  EXPIRED_CARD: 'Card has expired',
  INVALID_CARD: 'Invalid card details'
};

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Subscription status constants
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};
