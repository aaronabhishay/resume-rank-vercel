import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getApiUrl } from '../../utils/config';
import { loadRazorpayScript, createRazorpayInstance, paymentUtils, PAYMENT_ERRORS, PAYMENT_STATUS } from '../../utils/razorpay';

const PaymentModal = ({ planId, plan, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUS.PENDING);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay script
    loadRazorpayScript().then((loaded) => {
      if (!loaded) {
        setError('Failed to load payment system');
      }
    });
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Get user info (you might want to get this from your auth context)
      const userId = localStorage.getItem('user_id') || 'temp_user_' + Date.now();
      const userEmail = localStorage.getItem('user_email') || 'user@example.com';

      // Create order
      const orderResponse = await fetch(`${getApiUrl()}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          userEmail
        })
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create payment order');
      }

      setOrderData(orderResult);

      // Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        name: 'Resume Rank',
        description: `${plan.name} - Resume Analysis Service`,
        order_id: orderResult.order.id,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async function (response) {
          setPaymentStatus(PAYMENT_STATUS.PROCESSING);
          
          try {
            // Verify payment
            const verifyResponse = await fetch(`${getApiUrl()}/api/payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId,
                userId,
                userEmail
              })
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              setPaymentStatus(PAYMENT_STATUS.SUCCESS);
              // Redirect to dashboard or show success message
              setTimeout(() => {
                onClose();
                window.location.href = '/dashboard';
              }, 2000);
            } else {
              throw new Error(verifyResult.error || PAYMENT_ERRORS.SIGNATURE_VERIFICATION_FAILED);
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setError(verifyError.message);
            setPaymentStatus(PAYMENT_STATUS.FAILED);
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      setPaymentStatus(PAYMENT_STATUS.FAILED);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PROCESSING:
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>;
      case PAYMENT_STATUS.SUCCESS:
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case PAYMENT_STATUS.FAILED:
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PROCESSING:
        return 'Processing your payment...';
      case PAYMENT_STATUS.SUCCESS:
        return 'Payment successful! Redirecting to dashboard...';
      case PAYMENT_STATUS.FAILED:
        return 'Payment failed. Please try again.';
      default:
        return 'Complete your payment to get started';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl font-semibold">Complete Payment</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={loading || paymentStatus === 'processing'}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{plan.price.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>
              </div>

          {/* Payment Status */}
          {paymentStatus !== PAYMENT_STATUS.PENDING && (
            <div className={`flex items-center space-x-3 p-4 rounded-lg ${
              paymentStatus === PAYMENT_STATUS.SUCCESS ? 'bg-green-50' :
              paymentStatus === PAYMENT_STATUS.FAILED ? 'bg-red-50' :
              'bg-blue-50'
            }`}>
              {getStatusIcon()}
              <span className={`text-sm font-medium ${
                paymentStatus === PAYMENT_STATUS.SUCCESS ? 'text-green-800' :
                paymentStatus === PAYMENT_STATUS.FAILED ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {getStatusMessage()}
              </span>
            </div>
          )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Security Features */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secured by Razorpay</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>SSL encrypted payment</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>14-day money-back guarantee</span>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={loading || paymentStatus === PAYMENT_STATUS.PROCESSING || paymentStatus === PAYMENT_STATUS.SUCCESS}
                className="w-full"
                size="lg"
              >
                {loading || paymentStatus === PAYMENT_STATUS.PROCESSING ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ${paymentUtils.formatAmount(plan.price)}`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
