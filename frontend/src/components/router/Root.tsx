import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppTopBar } from "../sky/AppTopBar";
import Chatbot from "../layout/Chatbot";
import useDarkMode from "../shared/hooks/useDarkMode";
import useLastVisitedPath from "../shared/hooks/useLastVisitedPath";
import { useMe } from "../pages/auth/hooks/useMe";
// import { useRefreshToken } from "../pages/auth/hooks/useRefreshToken";
import Layout from "../layout/Layout";
import { useRoutePreloader } from "./RoutePreloader";
import { PageLoader } from "./components";


function Root() {
    // Layout Hooks
    useMe();
    useDarkMode();
    useLastVisitedPath();
    // useRefreshToken(); // רענון אוטומטי של token
    useRoutePreloader(); // טעינה מוקדמת של נתיבים
    const { pathname } = useLocation();
    // The Sky landing draws its own nav over the hero photo; the auth shell has its own logo
    const hasOwnNav = pathname === "/" || pathname === "/builder" || pathname.startsWith("/auth");

    return (
        <Layout>
            {!hasOwnNav && <AppTopBar />}
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
            <Chatbot />
        </Layout>
    )
}


export default Root