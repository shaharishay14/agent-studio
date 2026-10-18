import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface NavLogoProps {
    isDarkMode: boolean;
}

export const NavLogo = ({ isDarkMode }: NavLogoProps) => {
    return (
        <Link to="/" className="flex items-center gap-2">
            <img
                src="/assets/agent.png"
                alt="Agent Studio logo"
                className={`w-8 h-8 object-contain ${isDarkMode ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    }`}
            />
            <span className={`text-2xl font-bold ${
                isDarkMode
                    ? 'bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
            }`}>Agent Studio</span>
            <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-600 border border-purple-300'
                }`}>
                <Sparkles className="w-3 h-3" />
                AI
            </span>
        </Link>
    );
};

