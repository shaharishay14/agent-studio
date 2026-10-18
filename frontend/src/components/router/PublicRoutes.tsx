import { Navigate, Outlet } from "react-router-dom"
import { useUserStore } from "../../../store/user.store"


function PublicRoutes() {
    const { isAuthenticated } = useUserStore((state) => state)
    
    if (isAuthenticated) {
        // קרא את הנתיב האחרון מ-localStorage, אם אין - לך ל-builder
        const lastPath = localStorage.getItem('lastVisitedPath') || "/builder"
        return <Navigate to={lastPath} replace />
    }
    
    return <Outlet />
}

export default PublicRoutes

