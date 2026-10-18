import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface RotateInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  rotate?: number;
}

export const RotateIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  className = '',
  rotate = -180
}: RotateInProps) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, rotate, scale: 0 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ 
        duration, 
        delay,
        type: "spring",
        stiffness: 200
      }}
    >
      {children}
    </motion.span>
  );
};

