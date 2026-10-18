import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Preload routes that users are likely to visit
const routePreloadMap: Record<string, () => Promise<any>> = {
  '/builder': () => import('../pages/builder/Builder'),
  '/': () => import('../pages/builder/Builder'),
  '/agents': () => import('../pages/agents/Agents'),
  '/integrations': () => import('../pages/integrations/Integrations'),
  '/workflows': () => import('../pages/workflows/Workflows'),
  '/settings': () => import('../pages/settings/Settings'),
  '/auth/signin': () => import('../pages/auth/Signin'),
  '/auth/signup': () => import('../pages/auth/Signup'),
};

// Preload a route
export const preloadRoute = (path: string) => {
  const loader = routePreloadMap[path];
  if (loader) {
    loader();
  }
};

// Hook to preload next likely routes based on current location
export const useRoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    // Preload likely next routes after a short delay
    const timer = setTimeout(() => {
      if (location.pathname === '/auth/signin' || location.pathname === '/auth/signup') {
        // After auth, users likely go to builder
        preloadRoute('/builder');
      } else if (location.pathname === '/' || location.pathname === '/builder') {
        // From builder, users might go to agents or integrations
        preloadRoute('/agents');
        preloadRoute('/integrations');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname]);
};

export default useRoutePreloader;

