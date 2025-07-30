import React from "react";
import { motion } from "framer-motion";
import { useScrollAnimation, useParallax } from "../hooks/useScrollAnimation";

const SolutionSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.2 });
  const { ref: parallaxRef, offset } = useParallax(0.15);

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
    <section id="solution" className="section-spacing bg-gradient-to-b from-muted/10 to-background relative overflow-hidden">
      {/* Futuristic background elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-32 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-accent/20 rounded-full blur-3xl" 
             style={{ animation: 'float 12s ease-in-out infinite' }} />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-l from-accent/30 to-primary/15 rounded-full blur-3xl" 
             style={{ animation: 'float 15s ease-in-out infinite reverse', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
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
            The AI Solution
          </motion.p>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
            variants={itemVariants}
          >
            From{" "}
            <motion.span 
              className="text-destructive"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              1000+ Resumes
            </motion.span>{" "}
            to{" "}
            <motion.span 
              className="gradient-text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Perfect Top 10
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed"
            variants={itemVariants}
          >
            HirePilot's AI agent analyzes every resume with superhuman precision, 
            understanding context, skills, and potential like never before.
          </motion.p>
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
        >
          {[
            {
              title: "Intelligent Context Analysis",
              subtitle: "Beyond keyword matching", 
              description: "Our AI understands career trajectories, skill relationships, and hidden potential that human reviewers often miss."
            },
            {
              title: "Lightning Fast Processing",
              subtitle: "Seconds, not hours",
              description: "Process hundreds of applications in the time it takes to read one resume, with 98% accuracy and zero fatigue."
            },
            {
              title: "Smart Interview Coordination", 
              subtitle: "Schedule multiple interviews instantly",
              description: "Automatically coordinate calendars, handle timezones, and schedule multiple candidates with one click."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="p-8 rounded-2xl glass-card relative overflow-hidden group"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                y: -6,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-primary-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></motion.div>
              <motion.h3 
                className="text-2xl font-bold mb-4 text-accent relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
              >
                {feature.title}
              </motion.h3>
              <motion.p 
                className="text-lg mb-4 relative z-10 font-medium text-foreground/80"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                {feature.subtitle}
              </motion.p>
              <motion.p 
                className="text-muted-foreground relative z-10 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
        >
          {/* Before Section */}
          <motion.div 
            className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 glass-card"
            variants={itemVariants}
          >
            <motion.h3 
              className="text-2xl font-bold text-destructive mb-6 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              Before HirePilot
            </motion.h3>
            <div className="space-y-4">
              {[
                "150 resumes to review manually",
                "23 hours of screening time", 
                "70% great candidates missed",
                "Inconsistent evaluation criteria"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                >
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p className="font-medium text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          {/* After Section */}
          <motion.div 
            className="p-8 rounded-2xl bg-accent/5 border border-accent/20 glass-card"
            variants={itemVariants}
          >
            <motion.h3 
              className="text-2xl font-bold text-accent mb-6 flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              With HirePilot
            </motion.h3>
            <div className="space-y-4">
              {[
                "Top 25 candidates automatically ranked",
                "5 seconds processing time",
                "Instant interview scheduling for multiple candidates", 
                "Consistent, bias-free evaluation"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl bg-accent/5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                  whileHover={{ x: -4, transition: { duration: 0.2 } }}
                >
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="font-medium text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default SolutionSection; 