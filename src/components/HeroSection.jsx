import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useParallax } from "../hooks/useScrollAnimation";
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const { ref: parallaxRef, offset } = useParallax(0.2);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section className="relative min-h-screen hero-bg flex flex-col overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center py-6 px-6 md:px-8 backdrop-blur-md bg-card/10 border-b border-border/50 relative z-10"
      >
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-xl shadow-glow-violet animate-pulse"></div>
          <span className="text-xl font-bold text-foreground tracking-tight">HirePilot</span>
        </motion.div>
        <div className="hidden md:flex space-x-8">
          {["Problem", "Solution", "How it Works", "Reviews"].map((item, index) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-muted-foreground hover:text-foreground font-medium transition-all duration-200 relative group"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              whileHover={{ y: -1 }}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
            </motion.a>
          ))}
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="premium" 
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
          >
            Start Free Trial
          </Button>
        </motion.div>
      </motion.nav>
      {/* Hero Content */}
      <motion.div 
        className="flex-1 flex flex-col justify-center items-center text-center px-6 md:px-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              Trusted by 10,000+ hiring teams
            </span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight leading-none"
            variants={itemVariants}
          >
            <span className="text-foreground block mb-1">HirePilot:</span>
            <span className="text-foreground/90 block mb-1 font-medium">The AI Agent for</span>
            <span className="gradient-text block">Hiring Teams</span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed"
            variants={itemVariants}
          >
            Transform 1000+ applications into your perfect shortlist in seconds. 
            Let AI handle resume analysis while you focus on hiring the best talent.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            variants={itemVariants}
          >
            <Button 
              variant="outline"
              size="lg"
              className="h-12 px-8 font-semibold"
              onClick={() => navigate('/auth?view=sign-in&redirect=/dashboard')}
            >
              Sign In
            </Button>
            <Button 
              variant="premium" 
              size="lg" 
              className="h-12 px-8 font-semibold"
              onClick={() => navigate('/auth?view=sign-up')}
            >
              Sign Up
            </Button>
          </motion.div>
          <motion.p 
            className="text-sm text-muted-foreground font-medium"
            variants={itemVariants}
          >
            Free trial  No credit card required  Setup in 2 minutes
          </motion.p>
        </div>
      </motion.div>
      {/* Scroll Indicator */}
      <motion.div 
        className="flex flex-col items-center pb-8 text-muted-foreground relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <motion.p 
          className="text-xs font-medium mb-3 tracking-widest uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Scroll to discover
        </motion.p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection; 