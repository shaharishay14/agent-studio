import { NavLink, useLocation } from "react-router-dom";
import { navLinks } from "../constants/navLinks";

interface NavLinksProps {
    isDarkMode: boolean;
    onLinkClick?: () => void;
    isMobile?: boolean;
}

export const NavLinks = ({ isDarkMode, onLinkClick, isMobile = false }: NavLinksProps) => {
    const location = useLocation();
    
    return (
        <div className={isMobile ? "flex flex-col gap-2" : "hidden md:flex items-center gap-2"}>
            {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                return (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={onLinkClick}
                        className={`relative ${isMobile ? 'px-4 py-3' : 'px-4 py-2.5'} font-semibold transition-all duration-300 flex items-center ${isMobile ? 'gap-3' : 'gap-2'} ${
                            isActive
                                ? isDarkMode
                                    ? 'text-purple-400'
                                    : 'text-purple-700'
                                : isDarkMode
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-gray-700 hover:text-purple-700'
                        } ${
                            isMobile ? '' : 'group'
                        }`}
                    >
                        {!isMobile && (
                            <span className={`absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out ${
                                isActive
                                    ? isDarkMode
                                        ? 'w-full bg-gradient-to-r from-purple-500 to-pink-500'
                                        : 'w-full bg-gradient-to-r from-purple-600 to-pink-600'
                                    : 'w-0 group-hover:w-full bg-gradient-to-r from-purple-500 to-pink-500'
                            }`} />
                        )}
                        <Icon className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                        {link.label}
                    </NavLink>
                );
            })}
        </div>
    );
};

