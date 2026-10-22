import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Home, RotateCw, TriangleAlert } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { StatusScreen } from '../../sky/StatusScreen';

export default function ErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;
  const isNotFound = status === 404;
  const supportEmail = import.meta.env.VITE_MAIL_SUPPORT_TEAM;

  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      return error.statusText || error.data?.message || 'An unexpected error occurred';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  return (
    <div className="relative">
      {/* Full page reload so a broken app state doesn't come back */}
      <a href="/" className="absolute top-5 left-5 z-10 rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:left-8">
        <Logo />
      </a>

      <StatusScreen fullscreen>
        {status && <p className="m-0 font-display text-[64px] leading-none font-medium tracking-[-0.04em] text-white/90">{status}</p>}
        {!status && (
          <span className="grid size-14 place-items-center rounded-pill border border-white/30 bg-white/8" aria-hidden="true">
            <TriangleAlert className="size-6" strokeWidth={1.7} />
          </span>
        )}
        <h1 className="m-0 font-display text-[28px] leading-8 font-medium tracking-[-0.03em]">
          {isNotFound ? (
            <>
              This page <em className="sky-serif">doesn't exist</em>
            </>
          ) : (
            <>
              Something <em className="sky-serif">went wrong</em>
            </>
          )}
        </h1>
        <p className="m-0 text-white/75">
          {isNotFound ? 'The link may be old, or the address has a typo.' : getErrorMessage()}
        </p>

        <div className="mt-3 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <a href="/" className={buttonVariants({ variant: 'white' })}>
            <Home />
            Go to home
          </a>
          {!isNotFound && (
            <Button variant="glass" onClick={() => window.location.reload()}>
              <RotateCw />
              Try again
            </Button>
          )}
        </div>

        {supportEmail && (
          <p className="m-0 mt-2 text-sm text-white/66">
            Still stuck?{' '}
            <a href={`mailto:${supportEmail}`} className="font-medium text-white underline decoration-white/40 underline-offset-3 hover:decoration-white">
              Email support
            </a>
          </p>
        )}

        {/* Developer info (dev mode only) */}
        {import.meta.env.DEV && (
          <details className="mt-3 w-full text-left">
            <summary className="cursor-pointer text-sm text-white/60 hover:text-white">Technical details</summary>
            <pre className="mt-3 max-h-60 overflow-auto rounded-2xl border border-white/12 bg-night/70 p-4 font-mono text-xs text-white/80">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </StatusScreen>
    </div>
  );
}
