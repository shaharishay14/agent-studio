import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  className = '',
  y = 20 
}: FadeInProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 0.61, 0.36, 1] as const }}
    >
      {children}
    </motion.div>
  );
};

