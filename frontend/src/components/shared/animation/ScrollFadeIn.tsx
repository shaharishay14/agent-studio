import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScrollFadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
  margin?: string;
}

export const ScrollFadeIn = ({ 
  children, 
  delay = 0, 
  duration = 1.2, 
  className = '',
  y = 80,
  margin = "-100px"
}: ScrollFadeInProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ 
        duration, 
        delay,
        ease: [0.22, 0.61, 0.36, 1] as const 
      }}
    >
      {children}
    </motion.div>
  );
};

