import useDarkModeStore from "../../../store/darkmode.store";


function Layout({ children }: { children: React.ReactNode }) {

    const { isDarkMode } = useDarkModeStore();
    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDarkMode 
                ? 'bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900' 
                : 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30'
        }`}>
            {children}
        </div>
    )
}

export default Layout;