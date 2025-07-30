import React from "react";
import { motion } from "framer-motion";
import { useScrollAnimation, useStaggerAnimation } from "../hooks/useScrollAnimation";

const ProblemSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: statsRef, visibleItems } = useStaggerAnimation(3, 150);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section id="problem" className="section-spacing bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
      {/* Subtle futuristic background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-destructive/30 to-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-accent/20 to-destructive/30 rounded-full blur-3xl" 
             style={{ animationDelay: '2s' }} />
      </div>
      <motion.div 
        ref={sectionRef}
        className="max-w-6xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div className="text-center mb-20" variants={itemVariants}>
          <motion.p 
            className="text-primary text-sm font-semibold mb-4 tracking-wider uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            The Hiring Crisis
          </motion.p>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
            variants={itemVariants}
          >
            Hiring is{" "}
            <motion.span 
              className="text-destructive relative inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Overwhelmingly Broken
              <motion.div
                className="absolute -inset-2 bg-destructive/10 rounded-xl -z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              ></motion.div>
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed"
            variants={itemVariants}
          >
            Every hiring manager faces the same nightmare: drowning in resumes, 
            spending hours on manual screening, and still missing great candidates.
          </motion.p>
        </motion.div>
        <motion.div 
          ref={statsRef}
          className="grid md:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
        >
          {[
            { number: "23", unit: "hours", title: "Average time spent per hire", subtitle: "Just on resume screening alone" },
            { number: "70%", title: "Of great candidates overlooked", subtitle: "Due to manual bias and fatigue" },
            { number: "45%", title: "Hiring manager burnout rate", subtitle: "From repetitive screening tasks" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`text-center p-8 rounded-2xl glass-card transform transition-all duration-500 ${
                visibleItems.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              <motion.div 
                className="text-5xl md:text-6xl font-bold text-destructive mb-4"
                initial={{ scale: 0, rotate: -10 }}
                animate={visibleItems.includes(index) ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -10 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: "easeOut" }}
              >
                {stat.number}
              </motion.div>
              {stat.unit && <h3 className="text-lg font-semibold mb-3 text-destructive">{stat.unit}</h3>}
              <h3 className="text-xl font-semibold mb-3 text-foreground">{stat.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{stat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        >
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -translate-y-16 translate-x-16"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground mb-6 italic relative z-10 leading-relaxed">
            "I spend more time reading resumes than actually talking to candidates."
          </blockquote>
          <cite className="text-lg text-muted-foreground relative z-10 font-medium">
            — Every hiring manager, everywhere
          </cite>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ProblemSection; 