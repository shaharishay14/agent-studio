import { useState, useEffect } from 'react';
import useDarkModeStore from '../../../../../store/darkmode.store';
import { capabilities } from '../constants/capabilities';

function CapabilitiesSection() {
  const { isDarkMode } = useDarkModeStore();
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % capabilities.length);
    }, 2000); // כל 2 שניות

    return () => clearInterval(interval);
  }, [capabilities.length]);

  return (
    <div className="py-10 md:py-16 lg:py-20 px-4">
      <div className="mx-auto">
        {/* כותרת */}
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 md:mb-12 lg:mb-16 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Discover{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
            Agent Studio's
          </span>{' '}
          Capabilities
        </h2>

        {/* קו דקורטיבי מתחת לכותרת */}
        <div className="flex justify-center mb-8 md:mb-12 lg:mb-16">
          <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full" />
        </div>

        {/* כרטיסים */}
        <div className="relative max-w-full sm:max-w-xl md:max-w-2xl mx-auto gap-6 md:gap-8 lg:gap-10 flex flex-col">
          {capabilities.map((capability, index) => (
            <div key={capability.id} className="relative">
              {/* קו חיבור */}
              {index < capabilities.length - 1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-20 md:h-28 lg:h-32 bg-gradient-to-b from-blue-500/50 to-blue-600/50 z-0"
                     style={{ top: '100%' }} />
              )}

              {/* כרטיס */}
              <div
                className={`
                  relative mb-0 last:mb-0
                  transition-all duration-500 ease-in-out
                  ${activeCard === index
                    ? 'sm:scale-105 z-10'
                    : 'scale-100 z-0'
                  }
                `}
              >
                <div
                  className={`
                    relative
                    backdrop-blur-xl rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8
                    border transition-all duration-500
                    ${activeCard === index
                      ? `${isDarkMode ? 'bg-gray-800/90 border-purple-500/50' : 'bg-white/90 border-purple-400/50'} shadow-2xl shadow-purple-500/40`
                      : `${isDarkMode ? 'bg-gray-900/50 border-gray-700/30' : 'bg-white/50 border-gray-300/30'} shadow-lg`
                    }
                  `}
                >
                  {/* תוכן הכרטיס */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 md:gap-6">
                    {/* אייקון */}
                    <div
                      className={`
                        flex-shrink-0 p-3 sm:p-3.5 md:p-4 rounded-lg md:rounded-xl
                        transition-all duration-500
                        ${activeCard === index
                          ? `bg-gradient-to-br ${capability.color} text-white shadow-lg`
                          : `${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`
                        }
                      `}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                        {capability.icon}
                      </div>
                    </div>

                    {/* תוכן */}
                    <div className="flex-1">
                      <h3
                        className={`
                          text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-2.5 md:mb-3
                          transition-colors duration-500
                          ${isDarkMode ? 'text-white' : 'text-gray-900'}
                        `}
                      >
                        {capability.title}{' '}
                        <span
                          className={`
                            transition-all duration-500
                            ${activeCard === index
                              ? `text-transparent bg-clip-text bg-gradient-to-r ${capability.color}`
                              : `${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`
                            }
                          `}
                        >
                          {capability.titleHighlight}
                        </span>
                      </h3>
                      <p
                        className={`
                          text-sm sm:text-base md:text-lg
                          transition-colors duration-500
                          ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                        `}
                      >
                        {capability.description}
                      </p>
                    </div>
                  </div>

                  {/* אפקט זוהר פנימי לכרטיס הפעיל */}
                  {activeCard === index && (
                    <div
                      className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, rgba(168, 85, 247, 0.4) 0%, transparent 70%)`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* אינדיקטורים */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-8 md:mt-10 lg:mt-12">
          {capabilities.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`
                h-1.5 sm:h-2 rounded-full transition-all duration-500
                ${activeCard === index
                  ? 'w-8 sm:w-10 md:w-12 bg-gradient-to-r from-purple-500 to-pink-500'
                  : `w-1.5 sm:w-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`
                }
              `}
              aria-label={`Go to capability ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CapabilitiesSection;

