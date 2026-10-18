import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook ששומר את הנתיב האחרון ב-localStorage
 * מתעלם מנתיבי auth כדי למנוע הפניה חזרה לדפי אימות
 */
function useLastVisitedPath() {
    const location = useLocation();

    useEffect(() => {
        // שמור את הנתיב רק אם זה לא נתיב auth
        if (!location.pathname.startsWith('/auth')) {
            localStorage.setItem('lastVisitedPath', location.pathname);
        }
    }, [location.pathname]);
}

export default useLastVisitedPath;

