import useDarkModeStore from '../../../../../store/darkmode.store';
import { FadeIn, ScaleIn, RotateIn } from '../../../shared/animation';

function HeroSection() {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex flex-col items-center text-center mb-12 pt-16">
      <FadeIn delay={0.2} duration={0.8}>
        <h1 className="text-6xl font-bold mb-6">
          <FadeIn delay={0.4} duration={0.6} className="inline">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Create Your AI Agent,{' '}
            </span>
          </FadeIn>
          <ScaleIn delay={0.6} duration={0.6} scale={0.8} className="inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
              Now.
            </span>
          </ScaleIn>
          <RotateIn 
            delay={0.8} 
            duration={0.5} 
            rotate={-180}
            className={`ml-2 ${isDarkMode ? 'text-yellow-400' : 'text-orange-500'}`}
          >
            ⚡
          </RotateIn>
        </h1>
      </FadeIn>
      <FadeIn delay={1} duration={0.6}>
        <p className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          AI Agents. Simple. Fast. Powerful.
        </p>
      </FadeIn>
    </div>
  );
}

export default HeroSection;

