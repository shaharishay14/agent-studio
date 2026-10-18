import { useEffect } from "react";
import useDarkModeStore from "../../../../store/darkmode.store";



function useDarkMode() {
    const { setIsDarkMode, isDarkMode } = useDarkModeStore();


    useEffect(() => {
        // Initialize theme from localStorage
        const savedTheme = localStorage.theme;
        if (savedTheme) {
          setIsDarkMode(savedTheme === "dark");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setIsDarkMode(true);
        }
      }, []);


      useEffect(() => {
        localStorage.theme = isDarkMode ? "dark" : "light";
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        document.documentElement.classList.toggle(
          "dark",
          localStorage.theme === "dark" ||
          (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
        );
    
      }, [isDarkMode]);
    
}

export default useDarkMode;