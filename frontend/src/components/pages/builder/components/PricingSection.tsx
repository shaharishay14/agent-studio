import useDarkModeStore from '../../../../../store/darkmode.store';

function PricingSection() {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="text-center mb-12 md:mb-16">
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 ${
          isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent pb-1'
        }`}>Pricing</h2>
        <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          Join now to get unlimited access before pricing starts.
        </p>
        <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-3 md:mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="relative">
          <div className="absolute z-20 -top-3 md:-top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold">
              Current Plan
            </span>
          </div>
          <div className={`backdrop-blur-sm border-2 border-purple-500 rounded-2xl p-5 md:p-7 h-full ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50'
              : 'bg-gradient-to-br from-white to-purple-50/50 shadow-xl'
          }`}>
            <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Free</h3>
            <div className="flex items-baseline mb-4 md:mb-5">
              <span className={`text-4xl md:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$0</span>
              <span className={`text-base md:text-lg ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
            </div>

            <p className={`text-sm md:text-base mb-5 md:mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Get full access while we're in early access.
              <br />
              Help us shape Agent Studio's future.
            </p>

            <ul className="space-y-2.5 md:space-y-3 mb-5 md:mb-6">
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Agents and workflows
              </li>
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Triggers
              </li>
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                File uploads & processing
              </li>
            </ul>

            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 md:py-4 text-sm md:text-base rounded-xl transition-all">
              Join Free Early Access
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="relative opacity-60">
          <div className="absolute z-20 -top-3 md:-top-4 left-1/2 transform -translate-x-1/2">
            <span className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2 ${
              isDarkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-300 text-gray-600'
            }`}>
              <svg
                className="w-3 h-3 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Coming Soon
            </span>
          </div>
          <div className={`backdrop-blur-sm border rounded-2xl p-5 md:p-7 h-full ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300/50'
          }`}>
            <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Pro</h3>
            <div className="flex items-baseline mb-4 md:mb-5">
              <span className={`text-4xl md:text-6xl font-bold ${isDarkMode ? 'text-gray-600' : 'text-gray-700'}`}>$$$</span>
            </div>

            <p className={`text-sm md:text-base mb-5 md:mb-6 blur-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Advanced features for power users.
              <br />
              More details coming soon.
            </p>

            <ul className="space-y-2.5 md:space-y-3 mb-5 md:mb-6 blur-sm">
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-600' : 'text-gray-700'}`}>
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}`} />
                Advanced feature 1
              </li>
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-600' : 'text-gray-700'}`}>
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}`} />
                Advanced feature 2
              </li>
              <li className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isDarkMode ? 'text-gray-600' : 'text-gray-700'}`}>
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}`} />
                Advanced feature 3
              </li>
            </ul>

            <button
              disabled
              className={`w-full font-semibold py-3 md:py-4 text-sm md:text-base rounded-xl cursor-not-allowed ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;



