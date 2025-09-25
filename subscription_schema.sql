-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended
  payment_id TEXT,
  order_id TEXT,
  subscription_id TEXT, -- Razorpay subscription ID for recurring payments
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  last_charged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  CONSTRAINT valid_currency CHECK (currency = 'INR'),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Payment Logs Table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL,
  order_id TEXT,
  user_id TEXT,
  status TEXT NOT NULL, -- captured, failed, pending, refunded
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  error_code TEXT,
  error_description TEXT,
  razorpay_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  analyses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(user_id, month_year)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month_year ON usage_tracking(month_year);

-- RLS Policies for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment logs
CREATE POLICY "Users can view own payment logs" ON payment_logs
  FOR SELECT USING (auth.uid()::text = user_id);

-- RLS Policies for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own usage
CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own usage
CREATE POLICY "Users can update own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = user_id_param 
    AND status = 'active' 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id_param TEXT)
RETURNS TABLE(plan_id TEXT, status TEXT, expires_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT us.plan_id, us.status, us.expires_at
  FROM user_subscriptions us
  WHERE us.user_id = user_id_param 
  AND us.status = 'active' 
  AND us.expires_at > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track usage
CREATE OR REPLACE FUNCTION track_usage(user_id_param TEXT, plan_id_param TEXT)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO usage_tracking (user_id, plan_id, month_year, analyses_count)
  VALUES (user_id_param, plan_id_param, current_month, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    analyses_count = usage_tracking.analyses_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
