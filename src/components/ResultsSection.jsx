import React from "react";
import { motion } from "framer-motion";
import { useScrollAnimation, useStaggerAnimation } from "../hooks/useScrollAnimation";

const ResultsSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: statsRef, visibleItems } = useStaggerAnimation(4, 150);

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
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section className="section-spacing bg-gradient-background relative overflow-hidden">
      {/* Enhanced futuristic background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/40 to-accent/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-tl from-accent/35 to-primary/25 rounded-full blur-3xl" 
             style={{ animation: 'float 10s ease-in-out infinite', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/3 right-0 w-px h-full bg-gradient-to-b from-transparent via-accent/15 to-transparent" />
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
            className="text-accent text-sm font-semibold mb-4 tracking-wider uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Real Impact
          </motion.p>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
            variants={itemVariants}
          >
            Measurable Results{" "}
            <span className="gradient-text">Immediate Impact</span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed"
            variants={itemVariants}
          >
            Join thousands of hiring teams who've transformed their recruitment process 
            with quantifiable improvements.
          </motion.p>
        </motion.div>
        <motion.div 
          ref={statsRef}
          className="grid md:grid-cols-4 gap-6 mb-20"
          variants={containerVariants}
        >
          {[
            { number: "90%", title: "Time Saved", subtitle: "Less screening, faster decisions" },
            { number: "2M+", title: "Resumes Analyzed", subtitle: "With 98% AI precision" },
            { number: "5 sec", title: "Match Time", subtitle: "Upload to shortlist instantly" },
            { number: "95%", title: "Hiring Success Rate", subtitle: "Better matches, better hires" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`text-center p-8 rounded-2xl bg-card/30 backdrop-blur border border-border/50 premium-glow transform transition-all duration-500 ${
                visibleItems.includes(index) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
              whileHover={{ 
                scale: 1.05, 
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              <motion.div 
                className="text-4xl md:text-5xl font-bold text-primary mb-4"
                initial={{ scale: 0 }}
                animate={visibleItems.includes(index) ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
              >
                {stat.number}
              </motion.div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">{stat.title}</h3>
              <p className="text-muted-foreground font-medium">{stat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
            From Hours to Seconds, From Chaos to Clarity
          </h3>
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {[
            { title: "Save 20+ Hours", description: "Per hiring round on resume screening alone" },
            { title: "Schedule Instantly", description: "Coordinate multiple interviews with one click" },
            { title: "Hire Faster", description: "Focus on interviews, not paperwork" }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              className="text-center p-8 rounded-2xl bg-card/20 backdrop-blur border border-border/30"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <h4 className="text-xl font-bold text-accent mb-3">{benefit.title}</h4>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ResultsSection; 