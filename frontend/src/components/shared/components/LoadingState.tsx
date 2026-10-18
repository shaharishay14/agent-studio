import { motion } from 'framer-motion';
import useDarkModeStore from '../../../../store/darkmode.store';

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex justify-center items-center min-h-[500px]">
      <div className="text-center">
        {/* Agent GIF with animation */}
        <motion.div 
          className="mb-6 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img 
            src="/assets/gif/agent_look_around.gif" 
            alt="Loading Agent" 
            className="w-32 h-32 object-contain"
          />
        </motion.div>
        
        {/* Loading Text with Animated Dots */}
        <motion.div 
          className={`text-2xl font-semibold ${
            isDarkMode ? 'text-purple-300' : 'text-purple-700'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {message}
          <span className="inline-flex ml-1">
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
              }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.3,
              }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.6,
              }}
            >
              .
            </motion.span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default LoadingState;

