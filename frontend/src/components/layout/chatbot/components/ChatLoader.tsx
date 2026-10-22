import { Spinner } from '@/components/ui/spinner';

function ChatLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night-2 p-8" role="status">
      <Spinner />
      <p className="m-0 text-sm text-white/72">Connecting to support…</p>
    </div>
  );
}

export default ChatLoader;
