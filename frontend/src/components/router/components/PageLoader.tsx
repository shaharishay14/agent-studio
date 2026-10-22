import { Spinner } from '@/components/ui/spinner';

// Shown while a lazy page loads
function PageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-night">
      <Spinner label="Loading" />
    </div>
  );
}

export default PageLoader;
