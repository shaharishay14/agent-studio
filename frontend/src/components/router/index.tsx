import { Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import Root from './Root';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';
import { PageLoader, ErrorPage } from './components';
import {
    // Main pages
    Builder,
    Agents,
    Integrations,
    Workflows,
    Chat,
    Settings,
    PublicChat,
    AgentLoading,
    AgentSummary,
    // Auth pages
    Signup,
    Signin,
    ForgotPassword,
    ResetPassword,
    VerifyEmail,
    VerifyEmailPrompt,
    GithubCallback,
    // Legal pages
    TermsOfService,
    PrivacyPolicy
} from './lazyRoutes';


function Router() {

    const router = createBrowserRouter(
        createRoutesFromElements(
            <>
                {/* Public Chat Route - Standalone, no layout */}
                <Route
                    path="/public/chat/:agentid"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <PublicChat />
                        </Suspense>
                    }
                    errorElement={<ErrorPage />}
                />
                <Route path="/terms-of-service" element={<TermsOfService />} errorElement={<ErrorPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} errorElement={<ErrorPage />} />


                <Route path="/" element={<Root />} errorElement={<ErrorPage />}>
                    <Route index element={<Builder />} errorElement={<ErrorPage />} />
                    <Route path="/builder" element={<Builder />} errorElement={<ErrorPage />} />
                    <Route path="/agent-loading" element={<AgentLoading />} errorElement={<ErrorPage />} />
                    <Route path="/agent-summary" element={<AgentSummary />} errorElement={<ErrorPage />} />

                    {/* Auth Routes */}
                    <Route element={<PublicRoutes />}>
                        <Route path="/auth">
                            <Route path="signup" element={<Signup />} errorElement={<ErrorPage />} />
                            <Route path="signin" element={<Signin />} errorElement={<ErrorPage />} />
                            <Route path="forgot-password" element={<ForgotPassword />} errorElement={<ErrorPage />} />
                            <Route path="reset-password" element={<ResetPassword />} errorElement={<ErrorPage />} />
                            <Route path="verify-email" element={<VerifyEmail />} errorElement={<ErrorPage />} />
                            <Route path="verify-email-prompt" element={<VerifyEmailPrompt />} errorElement={<ErrorPage />} />
                            <Route path="callback/github" element={<GithubCallback />} errorElement={<ErrorPage />} />
                            <Route path="callback/google" element={<div>Google Callback</div>} errorElement={<ErrorPage />} />
                        </Route>
                    </Route>

                    <Route element={<PrivateRoutes />}>
                        <Route path="/agents" element={<Agents />} errorElement={<ErrorPage />} />
                        <Route path="/integrations" element={<Integrations />} errorElement={<ErrorPage />} />
                        <Route path="/workflows" element={<Workflows />} errorElement={<ErrorPage />} />
                        <Route path="/chat/:id" element={<Chat />} errorElement={<ErrorPage />} />
                        <Route path="/settings" element={<Settings />} errorElement={<ErrorPage />} />
                    </Route>
                </Route>
            </>
        )
    )

    return (
        <RouterProvider router={router} />
    )
}


export default Router;