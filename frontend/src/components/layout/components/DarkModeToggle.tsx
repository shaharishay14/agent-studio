import { Moon, Sun } from "lucide-react";

interface DarkModeToggleProps {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    className?: string;
    showLabel?: boolean;
}

export const DarkModeToggle = ({ isDarkMode, toggleDarkMode, className = "", showLabel = false }: DarkModeToggleProps) => {
    return (
        <button
            onClick={toggleDarkMode}
            className={`rounded-lg transition-all duration-300 border hover:shadow-lg flex items-center justify-center ${isDarkMode
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400 border-gray-700 hover:border-gray-600 hover:shadow-yellow-400/20'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300 hover:border-purple-400 hover:shadow-purple-400/30'
                } ${className}`}
            aria-label="Toggle dark mode"
        >
            <div className="relative w-5 h-5">
                <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDarkMode
                        ? '-rotate-90 opacity-0 scale-50'
                        : 'rotate-0 opacity-100 scale-100'
                    }`} />
                <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDarkMode
                        ? 'rotate-0 opacity-100 scale-100'
                        : 'rotate-90 opacity-0 scale-50'
                    }`} />
            </div>
            {showLabel && <span className="ml-2">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
    );
};

