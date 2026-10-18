function DecorativeElements() {
  return (
    <>
      {/* Decorative circles */}
      <div className="absolute top-32 left-[15%] w-4 h-4 bg-purple-500 rounded-full animate-pulse" />
      <div className="absolute top-48 left-[25%] w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-100" />
      <div className="absolute top-64 left-[10%] w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-200" />
      <div className="absolute top-40 right-[20%] w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-300" />
      <div className="absolute top-72 right-[15%] w-4 h-4 bg-purple-500 rounded-full animate-pulse delay-150" />
      <div className="absolute bottom-32 left-[20%] w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
      <div className="absolute bottom-48 right-[25%] w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-100" />
    </>
  );
}

export default DecorativeElements;

