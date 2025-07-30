import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Lock, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('sign-in'); // 'sign-in' or 'sign-up'
  const [message, setMessage] = useState('');

  // Set view from query param on mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlView = params.get('view');
    if (urlView === 'sign-in' || urlView === 'sign-up') {
      setView(urlView);
    }
  }, [location.search]);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/dashboard';
        navigate(redirectTo, { replace: true });
      }
    });
  }, [location, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (view === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Signed in! Redirecting...');
        // Redirect after sign-in
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/dashboard';
        setTimeout(() => navigate(redirectTo, { replace: true }), 1000);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styles and content for sign-in vs sign-up
  const isSignUp = view === 'sign-up';
  const orbColor = isSignUp
    ? 'from-emerald-400/30 via-blue-300/20 to-background'
    : 'from-primary/30 via-accent/20 to-background';
  const orbColor2 = isSignUp
    ? 'from-blue-300/30 via-emerald-400/20 to-background'
    : 'from-accent/30 via-primary/20 to-background';
  const icon = isSignUp ? <UserPlus className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-white" />;
  const heading = isSignUp ? 'Create Account' : 'Sign In';
  const subtitle = isSignUp
    ? 'Join Resume Ranker and start your journey!'
    : 'to Resume Ranker';
  const gradientText = isSignUp ? 'gradient-text bg-gradient-to-r from-emerald-400 to-blue-400' : 'gradient-text';

  // Animated gradient border for sign-up
  const cardBorder = isSignUp
    ? 'border-4 border-transparent bg-clip-padding bg-gradient-to-br from-emerald-400 via-blue-400 to-emerald-400 animate-gradient-border'
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background text-foreground overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br ${orbColor} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr ${orbColor2} rounded-full blur-2xl animate-pulse animation-delay-1000`} />
        {/* Removed animated particles for sign-up */}
      </div>
      {/* Card Wrapper for animated border on sign-up */}
      <motion.div
        className={`w-full max-w-md z-10 glass-card border-none shadow-2xl backdrop-blur-xl bg-card/80 dark:bg-card/70 relative transition-shadow duration-300 ${isSignUp ? 'hover:shadow-[0_0_32px_0_rgba(16,185,129,0.4)]' : 'hover:shadow-[0_0_32px_0_rgba(99,102,241,0.4)]'}`}
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
      >
        <CardHeader className="flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            {isSignUp ? (
              <motion.div
                key="signup-icon"
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-400 shadow-glow-primary mb-2"
                initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.7, rotate: 10, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {icon}
              </motion.div>
            ) : (
              <motion.div
                key="signin-icon"
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow-primary mb-2"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {icon}
              </motion.div>
            )}
          </AnimatePresence>
          <CardTitle className={`text-3xl font-bold tracking-tight ${gradientText} text-center`}>
            {heading}
          </CardTitle>
          <span className="text-muted-foreground text-sm font-medium text-center">{subtitle}</span>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-5 mt-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className={`glass-card transition-all duration-300 font-medium text-foreground placeholder:text-muted-foreground ${isSignUp ? 'border-emerald-500 focus-visible:ring-emerald-500' : 'border-primary focus-visible:ring-primary'}`}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={`glass-card transition-all duration-300 font-medium text-foreground placeholder:text-muted-foreground ${isSignUp ? 'border-emerald-500 focus-visible:ring-emerald-500' : 'border-primary focus-visible:ring-primary'}`}
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {message && <div className="text-green-500 text-sm text-center">{message}</div>}
            <Button type="submit" className={`w-full h-11 font-semibold ${isSignUp ? 'bg-gradient-to-r from-emerald-400 to-blue-400 text-white' : 'premium-button'} shadow-md`} disabled={loading}>
              {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            {view === 'sign-in' ? (
              <span className="text-muted-foreground text-sm">
                Don&apos;t have an account?{' '}
                <button
                  className="text-primary underline font-semibold hover:text-accent transition-colors"
                  onClick={() => setView('sign-up')}
                  type="button"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <button
                  className="text-primary underline font-semibold hover:text-accent transition-colors"
                  onClick={() => setView('sign-in')}
                  type="button"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </motion.div>
    </div>
  );
};

export default AuthPage;
