import { useState } from 'react';
import useDarkModeStore from '../../../../../store/darkmode.store';
import { motion, AnimatePresence } from 'framer-motion';
import { faqData } from '../constants/faqData';
import FooterLinks from './FooterLinks';

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isDarkMode } = useDarkModeStore();

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 md:py-20">
      <div className="text-center px-4">
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r bg-clip-text text-transparent pb-1 ${
          isDarkMode
            ? 'from-white to-gray-400'
            : 'from-purple-600 to-pink-600'
        }`}>
          Frequently Asked Questions
        </h2>
        <div className="w-24 md:w-32 h-1 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-3 md:space-y-4 px-4">
        {faqData.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/50'
                : 'bg-white/70 border border-purple-200/50 hover:border-purple-300/50 shadow-sm hover:shadow-md'
            }`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 md:p-6 text-left"
            >
              <span className={`text-base md:text-lg font-semibold pr-4 md:pr-8 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {faq.question}
              </span>
              <motion.svg
                className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-purple-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: "auto", 
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1]
                      },
                      opacity: {
                        duration: 0.25,
                        delay: 0.05,
                        ease: "easeOut"
                      }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: {
                      height: {
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      },
                      opacity: {
                        duration: 0.2,
                        ease: "easeIn"
                      }
                    }
                  }}
                  className="overflow-hidden"
                >
                  <motion.div 
                    className={`px-4 md:px-6 pb-4 md:pb-6 text-sm md:text-base leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    {faq.answer}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <FooterLinks />
    </section>
  );
}

export default FAQSection;



