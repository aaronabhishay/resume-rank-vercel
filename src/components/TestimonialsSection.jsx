import React from "react";
import { motion } from "framer-motion";
import { useScrollAnimation, useStaggerAnimation } from "../hooks/useScrollAnimation";

const TestimonialsSection = () => {
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: testimonialsRef, visibleItems } = useStaggerAnimation(3, 150);

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

  const testimonials = [
    {
      quote: "HirePilot transformed our hiring process completely. We went from drowning in resumes to having perfect candidates in minutes.",
      author: "Sarah Chen",
      role: "Head of Talent, TechFlow",
      rating: 5
    },
    {
      quote: "The AI screening is incredibly accurate. It found candidates we would have missed and saved us weeks of manual work.",
      author: "Marcus Rodriguez", 
      role: "VP of Engineering, DataCore",
      rating: 5
    },
    {
      quote: "Finally, a tool that actually understands what we're looking for. The quality of matches is phenomenal.",
      author: "Emily Watson",
      role: "Talent Director, InnovateLab",
      rating: 5
    }
  ];

  return (
    <section id="reviews" className="section-spacing bg-background relative overflow-hidden">
      {/* Futuristic ambient lighting */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 right-1/3 w-64 h-64 bg-gradient-to-l from-primary/30 to-accent/25 rounded-full blur-3xl" 
             style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-gradient-to-r from-accent/25 to-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-[400px] bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      </div>
      <motion.div 
        ref={sectionRef}
        className="max-w-6xl mx-auto"
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
            Customer Stories
          </motion.p>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
            variants={itemVariants}
          >
            Loved by{" "}
            <span className="gradient-text">Hiring Teams</span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed"
            variants={itemVariants}
          >
            See how leading companies are transforming their hiring with HirePilot.
          </motion.p>
        </motion.div>
        <motion.div 
          ref={testimonialsRef}
          className="grid md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className={`p-8 rounded-2xl bg-card/30 backdrop-blur border border-border/50 premium-glow transform transition-all duration-500 ${
                visibleItems.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              <div className="flex mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <motion.span 
                    key={i}
                    className="text-accent text-xl"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={visibleItems.includes(index) ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                    transition={{ delay: index * 0.1 + i * 0.05 + 0.3, duration: 0.3 }}
                  >
                    ★
                  </motion.span>
                ))}
              </div>
              <blockquote className="text-lg mb-6 text-foreground/90 font-medium leading-relaxed italic">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full mr-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-card/20 backdrop-blur border border-border/30">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-accent text-2xl">★</span>
              ))}
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-foreground">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average rating from 500+ reviews</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default TestimonialsSection; 