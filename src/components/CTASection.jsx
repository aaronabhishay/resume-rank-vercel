import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { useScrollAnimation, useStaggerAnimation } from "../hooks/useScrollAnimation";
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.3 });
  const { containerRef: statsRef, visibleItems } = useStaggerAnimation(3, 100);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section className="section-spacing bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-25">
        <div className="floating-orb absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20"></div>
        <div className="floating-orb absolute bottom-20 left-20 w-32 h-32 bg-accent/15 animation-delay-1000"></div>
        <div className="floating-orb absolute top-20 right-20 w-24 h-24 bg-violet/10 animation-delay-2000"></div>
      </div>
      <motion.div 
        ref={sectionRef}
        className="max-w-4xl mx-auto text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h2 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
          variants={itemVariants}
        >
          Ready to{" "}
          <motion.span 
            className="gradient-text relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Transform
            <motion.div
              className="absolute -inset-4 bg-gradient-glow opacity-30 rounded-xl blur-xl -z-10"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.4, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            ></motion.div>
          </motion.span>{" "}
          Your Hiring?
        </motion.h2>
        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          variants={itemVariants}
        >
          Join thousands of hiring teams who've eliminated resume screening chaos 
          and found their perfect candidates faster than ever.
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
          <Button 
            variant="secondary" 
            size="lg" 
            className="h-12 px-8 font-semibold"
            onClick={() => navigate('/pricing')}
          >
            View Pricing
          </Button>
        </motion.div>
        <motion.p 
          className="text-sm text-muted-foreground mb-16 font-medium"
          variants={itemVariants}
        >
          Free trial • No credit card required • Setup in 2 minutes
        </motion.p>
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          variants={containerVariants}
        >
          {[
            { number: "10,000+", label: "Happy Recruiters" },
            { number: "98%", label: "Accuracy Rate" },
            { number: "90%", label: "Time Saved" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`text-center transform transition-all duration-500 ${
                visibleItems.includes(index) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
              }`}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <motion.div 
                className="text-2xl md:text-3xl font-bold text-primary mb-2"
                initial={{ scale: 0 }}
                animate={visibleItems.includes(index) ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
              >
                {stat.number}
              </motion.div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CTASection; 