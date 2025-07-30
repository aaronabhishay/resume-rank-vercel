import React from "react";
import { motion } from "framer-motion";
import { Upload, Brain, Target, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { useScrollAnimation, useScrollProgress, useScrollTransform } from "../hooks/useScrollAnimation";

const HowItWorksSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.1, triggerOnce: false });
  const { ref: progressRef, progress } = useScrollProgress();
  const { ref: heroRef, transform: heroScale } = useScrollTransform([0, 0.5, 1], [0.8, 1, 1.2]);
  const { ref: step1Ref, transform: step1Y } = useScrollTransform([0, 0.4, 0.8], [60, 0, -30]);
  const { ref: step2Ref, transform: step2Y } = useScrollTransform([0.15, 0.5, 0.85], [60, 0, -30]);
  const { ref: step3Ref, transform: step3Y } = useScrollTransform([0.3, 0.65, 1], [60, 0, -30]);
  const { ref: step4Ref, transform: step4Y } = useScrollTransform([0.45, 0.8, 1.2], [60, 0, -30]);

  const steps = [
    {
      number: "01",
      title: "Upload & Analyze",
      icon: Upload,
      description: "Drop your resumes and job requirements. Our AI instantly processes and understands every detail.",
      detail: "Supports 50+ formats, extracts key skills, experience levels, and qualifications with 98% accuracy.",
      color: "from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/50"
    },
    {
      number: "02", 
      title: "AI Screening",
      icon: Brain,
      description: "Advanced algorithms evaluate each candidate against your specific criteria and culture fit.",
      detail: "Machine learning models trained on millions of successful hires across industries.",
      color: "from-blue-500 to-indigo-600",
      glowColor: "shadow-blue-500/50"
    },
    {
      number: "03",
      title: "Perfect Matches",
      icon: Target,
      description: "Receive ranked candidates with detailed insights, saving you 90% of screening time.",
      detail: "Get confidence scores, skill breakdowns, and personalized interview questions.",
      color: "from-emerald-500 to-teal-600",
      glowColor: "shadow-emerald-500/50"
    },
    {
      number: "04",
      title: "Schedule Interviews",
      icon: Calendar,
      description: "Schedule multiple interviews in one click with our intelligent calendar coordination.",
      detail: "Automated availability matching, timezone handling, and interview prep for seamless coordination.",
      color: "from-orange-500 to-red-600",
      glowColor: "shadow-orange-500/50"
    }
  ];

  return (
    <section 
      id="how-it-works" 
      ref={sectionRef}
      className="relative min-h-[400vh] bg-gradient-to-b from-background via-muted/5 to-background overflow-hidden"
    >
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-border z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-accent"
          style={{ 
            scaleX: progress,
            transformOrigin: "left"
          }}
        />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div 
          className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      <div ref={progressRef} className="relative z-10">
        {/* Hero Section */}
        <div className="py-20 px-4">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p 
              className="text-primary text-sm font-semibold mb-6 tracking-wider uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Experience the Magic
            </motion.p>
            <motion.h2 
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-none"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              From Chaos to{" "}
              <span className="gradient-text block mt-2">Clarity in 4 Steps</span>
            </motion.h2>
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Our AI-powered process transforms hiring from a time-consuming nightmare 
              into an elegant, efficient experience.
            </motion.p>
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-primary-subtle backdrop-blur border border-primary/20">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Scroll to discover the journey</span>
                <ArrowRight className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Steps Journey */}
        <div className="space-y-[10vh]">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const refs = [step1Ref, step2Ref, step3Ref, step4Ref];
            const transforms = [step1Y, step2Y, step3Y, step4Y];
            return (
              <div 
                key={index}
                ref={refs[index]}
                className="min-h-[80vh] flex items-center justify-center px-4"
              >
                <motion.div 
                  className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center"
                  style={{ 
                    y: transforms[index],
                    opacity: Math.max(0, 1 - Math.abs(transforms[index]) / 100)
                  }}
                >
                  {/* Content Side */}
                  <div className={`${index % 2 === 1 ? 'md:order-2' : ''} space-y-8`}>
                    <div className="space-y-6">
                      <motion.div 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                      >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center ${step.glowColor} shadow-2xl`}>
                          <StepIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-6xl font-bold text-primary/20">{step.number}</span>
                      </motion.div>
                      <motion.h3 
                        className="text-4xl md:text-5xl font-bold text-foreground leading-tight"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        {step.title}
                      </motion.h3>
                      <motion.p 
                        className="text-xl text-muted-foreground leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                      >
                        {step.description}
                      </motion.p>
                      <motion.p 
                        className="text-lg text-muted-foreground/80 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
                      >
                        {step.detail}
                      </motion.p>
                    </div>
                  </div>
                  {/* Visual Side */}
                  <div className={`${index % 2 === 1 ? 'md:order-1' : ''} relative`}>
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      viewport={{ once: true }}
                    >
                      {/* Glowing background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-20 blur-3xl rounded-3xl transform scale-110`} />
                      {/* Main visual container */}
                      <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12">
                        <motion.div
                          className="space-y-6"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          viewport={{ once: true }}
                        >
                          {/* Step visualization */}
                          <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center ${step.glowColor} shadow-2xl`}>
                            <StepIcon className="w-12 h-12 text-white" />
                          </div>
                          {/* Progress indicators */}
                          <div className="flex justify-center gap-2">
                            {[0, 1, 2, 3].map((i) => (
                              <motion.div
                                key={i}
                                className={`h-2 rounded-full ${
                                  i <= index ? `bg-gradient-to-r ${step.color}` : 'bg-border'
                                }`}
                                style={{ width: i === index ? '32px' : '8px' }}
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                                viewport={{ once: true }}
                              />
                            ))}
                          </div>
                          {/* Animated elements */}
                          <motion.div
                            className="grid grid-cols-3 gap-4 opacity-50"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 0.5, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            viewport={{ once: true }}
                          >
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="h-8 bg-gradient-to-r from-border to-border/50 rounded"
                                animate={{
                                  opacity: [0.3, 0.7, 0.3],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
        {/* Final Result Section */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-block p-12 rounded-3xl bg-gradient-primary-subtle backdrop-blur-xl border border-primary/30 premium-glow"
              whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow-primary"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h4 className="text-2xl font-bold text-primary mb-6">Result</h4>
              <p className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Perfect shortlist ready for interviews
              </p>
              <motion.div
                className="mt-8 text-lg text-muted-foreground"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
              >
                Save 90% of your time 2 Zero bias 22 98% accuracy
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 