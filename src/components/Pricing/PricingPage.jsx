import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import PaymentModal from './PaymentModal';
import { getApiUrl } from '../../utils/config';

const PricingPage = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/payment/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      } else {
        console.error('API returned error:', data.error);
        // Set default plans if API fails
        setPlans({
          basic: {
            name: 'Basic Plan',
            price: 999,
            currency: 'INR',
            description: 'Perfect for small teams',
            features: [
              'Up to 50 resume analyses per month',
              'Basic AI analysis',
              'Email support',
              'Standard processing speed'
            ]
          },
          professional: {
            name: 'Professional Plan',
            price: 2499,
            currency: 'INR',
            description: 'Ideal for growing companies',
            features: [
              'Up to 200 resume analyses per month',
              'Advanced AI analysis with custom weights',
              'Priority support',
              'Faster processing',
              'Export results to Excel'
            ]
          },
          enterprise: {
            name: 'Enterprise Plan',
            price: 4999,
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
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      // Set default plans on error
      setPlans({
        basic: {
          name: 'Basic Plan',
          price: 999,
          currency: 'INR',
          description: 'Perfect for small teams',
          features: [
            'Up to 50 resume analyses per month',
            'Basic AI analysis',
            'Email support',
            'Standard processing speed'
          ]
        },
        professional: {
          name: 'Professional Plan',
          price: 2499,
          currency: 'INR',
          description: 'Ideal for growing companies',
          features: [
            'Up to 200 resume analyses per month',
            'Advanced AI analysis with custom weights',
            'Priority support',
            'Faster processing',
            'Export results to Excel'
          ]
        },
        enterprise: {
          name: 'Enterprise Plan',
          price: 4999,
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
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const planIcons = {
    basic: <Zap className="w-6 h-6" />,
    professional: <Star className="w-6 h-6" />,
    enterprise: <Crown className="w-6 h-6" />
  };

  const planColors = {
    basic: 'border-gray-200 hover:border-blue-300',
    professional: 'border-blue-200 hover:border-blue-400 ring-2 ring-blue-100',
    enterprise: 'border-purple-200 hover:border-purple-400 ring-2 ring-purple-100'
  };

  const planBadges = {
    basic: null,
    professional: <Badge className="bg-blue-100 text-blue-800">Most Popular</Badge>,
    enterprise: <Badge className="bg-purple-100 text-purple-800">Best Value</Badge>
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your
            <span className="gradient-text"> Perfect Plan</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Scale your hiring process with our AI-powered resume analysis. 
            Start with our free trial, then choose the plan that fits your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(plans).map(([planId, plan], index) => (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <Card className={`h-full transition-all duration-300 hover:shadow-xl ${planColors[planId]}`}>
                {planBadges[planId] && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    {planBadges[planId]}
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      {planIcons[planId]}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">₹{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(planId)}
                    className={`w-full ${
                      planId === 'professional' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : planId === 'enterprise'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : ''
                    }`}
                    size="lg"
                  >
                    {planId === 'basic' ? 'Start Free Trial' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Secure payments
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              24/7 support
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Money-back guarantee
            </div>
          </div>
        </motion.div>
      </div>

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          planId={selectedPlan}
          plan={plans[selectedPlan]}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default PricingPage;
