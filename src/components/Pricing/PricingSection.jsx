import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const PricingSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.3 });

  const plans = {
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
      ],
      limits: {
        monthlyAnalyses: 50,
        concurrentJobs: 2
      }
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
      ],
      limits: {
        monthlyAnalyses: 200,
        concurrentJobs: 5
      }
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
      ],
      limits: {
        monthlyAnalyses: -1,
        concurrentJobs: 10
      }
    }
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

  const handleViewPricing = () => {
    window.location.href = '/pricing';
  };

  return (
    <section ref={sectionRef} className="section-spacing bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-25">
        <div className="floating-orb absolute top-20 left-1/4 w-32 h-32 bg-primary/20"></div>
        <div className="floating-orb absolute bottom-20 right-1/4 w-24 h-24 bg-accent/15 animation-delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent
            <span className="gradient-text"> Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial, then choose the plan that scales with your hiring needs.
            No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {Object.entries(plans).map(([planId, plan], index) => (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
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
                    onClick={handleViewPricing}
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
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-muted/50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Free Trial Included</h3>
            <p className="text-muted-foreground mb-6">
              Try any plan risk-free for 14 days. No credit card required to start.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Money-back guarantee</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
