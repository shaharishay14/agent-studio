import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Nav from "../layout/Nav";
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

    return (
        <Layout>
            <Nav />
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
            <Chatbot />
        </Layout>
    )
}


export default Root