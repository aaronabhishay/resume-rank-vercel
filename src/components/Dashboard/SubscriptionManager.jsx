import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getApiUrl } from '../../utils/config';
import { supabase } from '../../supabaseClient';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({});

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        // No user logged in, set default free plan
        setSubscription({
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null,
          monthlyAnalyses: 10,
          usedAnalyses: 0,
          remainingAnalyses: 10
        });
        setUsage({
          thisMonth: 0,
          lastMonth: 0,
          totalAnalyses: 0
        });
        setLoading(false);
        return;
      }

      // Fetch subscription data from backend
      const subscriptionResponse = await fetch(`${getApiUrl()}/api/payment/subscription/current?userId=${userId}`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);
      } else {
        // No subscription found, set default free plan
        setSubscription({
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null,
          monthlyAnalyses: 10, // Free plan limit
          usedAnalyses: 0,
          remainingAnalyses: 10
        });
      }

      // Fetch usage data from backend
      const usageResponse = await fetch(`${getApiUrl()}/api/payment/subscription/usage?userId=${userId}`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      } else {
        // Default usage data
        setUsage({
          thisMonth: 0,
          lastMonth: 0,
          totalAnalyses: 0
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      // Set default data on error
      setSubscription({
        plan: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
        monthlyAnalyses: 10,
        usedAnalyses: 0,
        remainingAnalyses: 10
      });
      setUsage({
        thisMonth: 0,
        lastMonth: 0,
        totalAnalyses: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const planDetails = {
    free: {
      name: 'Free Plan',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    basic: {
      name: 'Basic Plan',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    professional: {
      name: 'Professional Plan',
      icon: <Star className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    enterprise: {
      name: 'Enterprise Plan',
      icon: <Crown className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleManageBilling = () => {
    // In a real app, this would open a billing portal
    alert('Billing management coming soon!');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = planDetails[subscription?.plan] || planDetails.basic;
  const usagePercentage = subscription ? (subscription.usedAnalyses / subscription.monthlyAnalyses) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription>Manage your current plan and usage</CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
                  Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className={`p-4 rounded-lg border ${currentPlan.borderColor} ${currentPlan.bgColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${currentPlan.bgColor} ${currentPlan.color}`}>
                  {currentPlan.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{currentPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.monthlyAnalyses === -1 ? 'Unlimited' : `${subscription?.monthlyAnalyses} analyses`} per month
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleUpgrade}>
                Upgrade Plan
              </Button>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{usage.thisMonth}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{usage.lastMonth}</div>
              <div className="text-sm text-muted-foreground">Last Month</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{usage.totalAnalyses}</div>
              <div className="text-sm text-muted-foreground">Total Analyses</div>
            </div>
          </div>

          {/* Usage Progress */}
          {subscription?.monthlyAnalyses !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Usage</span>
                <span>{subscription.usedAnalyses} / {subscription.monthlyAnalyses}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              {usagePercentage > 80 && (
                <div className="flex items-center space-x-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>You're approaching your monthly limit</span>
                </div>
              )}
            </div>
          )}

          {/* Billing Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Next billing date</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <Button variant="ghost" onClick={handleManageBilling}>
                Manage Billing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
