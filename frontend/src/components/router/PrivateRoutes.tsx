import { Navigate, Outlet } from "react-router-dom"
import { useUserStore } from "../../../store/user.store"



function PrivateRoutes() {
    const { isAuthenticated } = useUserStore((state) => state)
    if (!isAuthenticated) {
        return <Navigate to="/auth/signin" />
    }
    return (
        <Outlet />
    )
}

export default PrivateRoutes