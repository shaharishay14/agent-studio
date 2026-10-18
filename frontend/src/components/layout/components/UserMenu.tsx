import { Link } from "react-router-dom";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { type RefObject } from "react";

interface UserMenuProps {
    isDarkMode: boolean;
    user: { email: string };
    isUserMenuOpen: boolean;
    toggleUserMenu: () => void;
    setIsUserMenuOpen: (value: boolean) => void;
    logout: () => void;
    userMenuRef: RefObject<HTMLDivElement | null>;
    getInitial: () => string;
}

export const UserMenu = ({
    isDarkMode,
    user,
    isUserMenuOpen,
    toggleUserMenu,
    setIsUserMenuOpen,
    logout,
    userMenuRef,
    getInitial
}: UserMenuProps) => {
    return (
        <div className="relative" ref={userMenuRef}>
            <button
                onClick={toggleUserMenu}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border ${isDarkMode
                        ? 'bg-gradient-to-r from-purple-900/30 via-gray-800/50 to-pink-900/30 hover:from-purple-800/40 hover:via-gray-700/60 hover:to-pink-800/40 text-white border-purple-500/30 hover:border-purple-400/50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                        : 'bg-gradient-to-r from-purple-50 via-pink-50 to-purple-100 hover:from-purple-100 hover:via-pink-100 hover:to-purple-200 text-gray-900 border-purple-300 hover:border-purple-400 shadow-xl shadow-purple-300/50 hover:shadow-2xl hover:shadow-purple-400/60 ring-2 ring-purple-200/30 hover:ring-purple-300/50'
                    }`}
            >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-medium">{user.email}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border overflow-hidden backdrop-blur-md ${isDarkMode
                        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-purple-500/30 shadow-purple-500/30'
                        : 'bg-gradient-to-br from-white via-purple-50/50 to-pink-50/30 border-purple-300 shadow-2xl shadow-purple-300/50 ring-2 ring-purple-200/40'
                    }`}>
                    <div className={`px-4 py-3 border-b ${isDarkMode 
                        ? 'border-purple-500/20' 
                        : 'border-purple-200/50'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {getInitial()}
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {user.email}
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Free Plan
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2">
                        <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className={`px-4 py-2 flex items-center gap-3 transition-all duration-200 rounded-lg mx-2 ${isDarkMode
                                    ? 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/15 hover:to-purple-500/20 hover:text-white'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:via-pink-50 hover:to-purple-100 hover:text-purple-900'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="font-medium">Settings</span>
                        </Link>

                        <button
                            onClick={() => {
                                setIsUserMenuOpen(false);
                                logout();
                            }}
                            className={`w-full px-4 py-2 flex items-center gap-3 transition-all duration-200 rounded-lg mx-2 ${isDarkMode
                                    ? 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/15 hover:to-purple-500/20 hover:text-white'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:via-pink-50 hover:to-purple-100 hover:text-purple-900'
                                }`}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

