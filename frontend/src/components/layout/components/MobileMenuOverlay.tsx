interface MobileMenuOverlayProps {
    isDarkMode: boolean;
    closeMobileMenu: () => void;
}

export const MobileMenuOverlay = ({ isDarkMode, closeMobileMenu }: MobileMenuOverlayProps) => {
    return (
        <div
            className={`fixed inset-0 z-40 md:hidden transition-colors duration-300 backdrop-blur-sm ${isDarkMode ? 'bg-black/60' : 'bg-black/40'
                }`}
            onClick={closeMobileMenu}
        />
    );
};

