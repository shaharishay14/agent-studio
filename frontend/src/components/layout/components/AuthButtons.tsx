import { Link } from "react-router-dom";
import { authButtons } from "../constants/navLinks";

interface AuthButtonsProps {
    isDarkMode: boolean;
    onButtonClick?: () => void;
    isMobile?: boolean;
}

export const AuthButtons = ({ isDarkMode, onButtonClick, isMobile = false }: AuthButtonsProps) => {
    return (
        <>
            {authButtons.map((button) => {
                const Icon = button.icon;
                return (
                    <Link
                        key={button.to}
                        to={button.to}
                        onClick={onButtonClick}
                        className={
                            button.variant === "primary"
                                ? `${isMobile ? 'px-6 py-3 justify-center' : 'px-6 py-2'} font-medium flex items-center gap-2 transition-all duration-300 bg-gradient-to-r from-purple-500 via-purple-400 to-orange-400 text-white rounded-xl shadow-lg ${!isMobile ? 'hover:scale-105' : ''} ${isDarkMode
                                    ? 'shadow-purple-500/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.8)]'
                                    : 'shadow-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                                }`
                                : `${isMobile ? 'px-6 py-3 justify-center' : 'px-6 py-2'} font-medium flex items-center gap-2 transition-all duration-300 rounded-lg border ${isDarkMode
                                    ? 'text-white bg-white/5 border-gray-800 hover:bg-white/10'
                                    : 'text-gray-900 bg-white border-gray-400 shadow-md hover:bg-gray-50'
                                }`
                        }
                    >
                        {Icon && <Icon className="w-4 h-4" />}
                        {button.label}
                        {button.showArrow && <span className="text-lg">→</span>}
                    </Link>
                );
            })}
        </>
    );
};

