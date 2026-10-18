import useDarkModeStore from '../../../../../store/darkmode.store';

function EmptyAgent() {
  const { isDarkMode } = useDarkModeStore();

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="text-center mb-12 md:mb-16">
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Agents</span>
        </h2>
        <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
      </div>
      <div className="text-center py-8 md:py-12">
        <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No agents yet. Create your first agent to get started!
        </p>
      </div>
    </section>
  );
}

export default EmptyAgent;

