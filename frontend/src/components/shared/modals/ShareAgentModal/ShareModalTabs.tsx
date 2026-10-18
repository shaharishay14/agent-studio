import { Link, QrCode, Code } from 'lucide-react';
import type { TabsProps } from './types';

export function ShareModalTabs({ activeTab, setActiveTab, isDarkMode }: TabsProps) {
  const tabBaseClass = "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all text-sm";
  
  const getTabClass = (tab: string) => {
    const isActive = activeTab === tab;
    
    if (isActive) {
      return `${tabBaseClass} ${
        isDarkMode
          ? 'bg-white/10 text-white'
          : 'bg-gray-900 text-white'
      }`;
    }
    
    return `${tabBaseClass} ${
      isDarkMode
        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;
  };

  return (
    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
      <button
        onClick={() => setActiveTab('link')}
        className={getTabClass('link')}
      >
        <Link className="w-4 h-4" />
        <span className="hidden xs:inline">Link</span>
      </button>
      <button
        onClick={() => setActiveTab('qr')}
        className={getTabClass('qr')}
      >
        <QrCode className="w-4 h-4" />
        <span className="hidden xs:inline">QR</span>
      </button>
      <button
        onClick={() => setActiveTab('embed')}
        className={getTabClass('embed')}
      >
        <Code className="w-4 h-4" />
        <span className="hidden xs:inline">Embed</span>
      </button>
    </div>
  );
}

