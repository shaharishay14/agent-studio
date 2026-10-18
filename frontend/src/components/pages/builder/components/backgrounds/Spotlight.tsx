const Spotlight = () => {
  return (
    <div className="absolute top-0 left-0 right-0 z-[1] pointer-events-none h-[1200px]">
      <div 
        className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-40 dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 30%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.2) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
};

export default Spotlight;

