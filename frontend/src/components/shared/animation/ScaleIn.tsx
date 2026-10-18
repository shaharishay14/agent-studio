import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  scale?: number;
  springy?: boolean;
}

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  className = '',
  scale = 0.8,
  springy = false
}: ScaleInProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        springy 
          ? { duration, delay, type: "spring", stiffness: 200 }
          : { duration, delay, ease: [0.22, 0.61, 0.36, 1] as const }
      }
    >
      {children}
    </motion.div>
  );
};

