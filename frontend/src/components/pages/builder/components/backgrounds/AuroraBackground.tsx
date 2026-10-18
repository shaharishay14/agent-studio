import { motion } from 'framer-motion';

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Aurora Effect - Multiple Layers */}
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168, 85, 247, 0.4), transparent),
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(236, 72, 153, 0.3), transparent),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(59, 130, 246, 0.3), transparent)
          `,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Moving Aurora Wave */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundImage: `
            linear-gradient(125deg, 
              transparent 0%, 
              rgba(168, 85, 247, 0.1) 25%, 
              rgba(236, 72, 153, 0.1) 50%, 
              rgba(59, 130, 246, 0.1) 75%, 
              transparent 100%)
          `,
          backgroundSize: '200% 200%',
        }}
      />
      
      {/* Shimmer Effect */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Bottom Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
};

export default AuroraBackground;

