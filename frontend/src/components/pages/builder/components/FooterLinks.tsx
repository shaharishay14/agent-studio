import { Link } from 'react-router-dom';
import useDarkModeStore from '../../../../../store/darkmode.store';

function FooterLinks() {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className={`flex flex-wrap justify-center gap-4 md:gap-8 mt-12 md:mt-16 text-xs md:text-sm px-4 ${
      isDarkMode ? 'text-gray-500' : 'text-gray-600'
    }`}>
      <Link to="/privacy-policy" className={`transition-colors ${
        isDarkMode ? 'hover:text-gray-300' : 'hover:text-purple-600'
      }`}>
        Privacy Policy
      </Link>
      <span className="hidden sm:inline">•</span>
      <Link to="/terms-of-service" className={`transition-colors ${
        isDarkMode ? 'hover:text-gray-300' : 'hover:text-purple-600'
      }`}>
        Terms of Service
      </Link>
    </div>
  );
}

export default FooterLinks;

