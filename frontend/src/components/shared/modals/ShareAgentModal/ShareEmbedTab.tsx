import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ShareEmbedTabProps } from './types';

export function ShareEmbedTab({ embedCode, onCopy }: ShareEmbedTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-white/72">Paste this into your website, blog or app to show the chat on your page.</p>
      <pre className="m-0 max-h-48 overflow-auto rounded-2xl border border-white/15 bg-night/60 p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap text-white/85">
        <code>{embedCode}</code>
      </pre>
      <Button block onClick={() => onCopy(embedCode, 'Embed code')}>
        <Copy />
        Copy embed code
      </Button>
    </div>
  );
}
