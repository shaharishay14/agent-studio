import { Link } from "react-router-dom";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { DarkModeToggle } from "./DarkModeToggle";
import { AuthButtons } from "./AuthButtons";

interface MobileMenuProps {
    isDarkMode: boolean;
    isMobileMenuOpen: boolean;
    closeMobileMenu: () => void;
    toggleDarkMode: () => void;
    isAuthenticated: boolean;
    user: { email: string } | null;
    getInitial: () => string;
    logout: () => void;
}

export const MobileMenu = ({
    isDarkMode,
    isMobileMenuOpen,
    closeMobileMenu,
    toggleDarkMode,
    isAuthenticated,
    user,
    getInitial,
    logout
}: MobileMenuProps) => {
    return (
        <div
            className={`fixed top-0 right-0 h-full w-80 z-50 transform transition-all duration-300 ease-in-out md:hidden border-l ${isDarkMode
                    ? 'bg-[#0a0a0a] border-gray-800'
                    : 'bg-gradient-to-b from-purple-50 via-white to-pink-50 border-purple-200 shadow-2xl'
                } ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Menu Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-purple-200'
                }`}>
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/agent.png"
                        alt="Agent Studio logo"
                        className={`w-8 h-8 object-contain ${isDarkMode ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'drop-shadow-[0_0_6px_rgba(168,85,247,0.3)]'
                            }`}
                    />
                    <span className={`text-xl font-bold ${isDarkMode
                            ? 'text-white'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
                        }`}>Agent Studio</span>
                </div>
                <button
                    onClick={closeMobileMenu}
                    className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-lg relative overflow-hidden ${isDarkMode
                            ? 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600 hover:shadow-gray-700/20'
                            : 'text-purple-700 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 border-purple-300 hover:border-purple-400 hover:shadow-purple-400/30'
                        }`}
                    aria-label="Close menu"
                >
                    <div className="relative w-5 h-5">
                        <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                        <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`} />
                    </div>
                </button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col h-[calc(100%-88px)]">
                {/* Navigation Links */}
                <div className="p-6">
                    <NavLinks
                        isDarkMode={isDarkMode}
                        onLinkClick={closeMobileMenu}
                        isMobile={true}
                    />
                </div>

                {/* Dark Mode Toggle + Auth Buttons / User Menu */}
                <div className={`mt-auto p-6 flex flex-col gap-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-purple-200'
                    }`}>
                    {/* Dark Mode Toggle Button */}
                    <DarkModeToggle
                        isDarkMode={isDarkMode}
                        toggleDarkMode={toggleDarkMode}
                        className="w-full px-4 py-3 font-medium gap-2"
                        showLabel={true}
                    />

                    {isAuthenticated && user ? (
                        /* User Menu in Mobile */
                        <>
                            {/* User Info */}
                            <div className={`px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                        {getInitial()}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {user.email}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Free Plan
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Button */}
                            <Link
                                to="/settings"
                                onClick={closeMobileMenu}
                                className={`px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 rounded-lg border ${isDarkMode
                                        ? 'text-white bg-white/5 border-gray-800 hover:bg-white/10'
                                        : 'text-gray-900 bg-white border-gray-400 shadow-md hover:bg-gray-50'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>

                            {/* Sign Out Button */}
                            <button
                                onClick={() => {
                                    closeMobileMenu();
                                    logout();
                                }}
                                className={`px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 rounded-lg border ${isDarkMode
                                        ? 'text-white bg-white/5 border-gray-800 hover:bg-white/10'
                                        : 'text-gray-900 bg-white border-gray-400 shadow-md hover:bg-gray-50'
                                    }`}
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </>
                    ) : (
                        /* Auth Buttons */
                        <AuthButtons
                            isDarkMode={isDarkMode}
                            onButtonClick={closeMobileMenu}
                            isMobile={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

