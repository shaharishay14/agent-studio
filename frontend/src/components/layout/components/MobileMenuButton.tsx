import { Menu, X } from "lucide-react";

interface MobileMenuButtonProps {
    isDarkMode: boolean;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
}

export const MobileMenuButton = ({ isDarkMode, isMobileMenuOpen, toggleMobileMenu }: MobileMenuButtonProps) => {
    return (
        <button
            onClick={toggleMobileMenu}
            className={`md:hidden p-2 rounded-lg border transition-all duration-200 hover:shadow-lg relative overflow-hidden ${isDarkMode
                    ? 'text-white bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600 hover:shadow-gray-700/20'
                    : 'text-purple-700 bg-purple-100 hover:bg-purple-200 border-purple-300 hover:border-purple-400 hover:shadow-purple-400/30'
                }`}
            aria-label="Toggle menu"
        >
            <div className="relative w-5 h-5">
                <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
            </div>
        </button>
    );
};

