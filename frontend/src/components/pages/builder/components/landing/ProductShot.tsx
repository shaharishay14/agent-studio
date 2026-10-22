import { ArrowUp, Lock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { LogoMark } from '@/components/ui/logo';
import { StatusDot } from '@/components/ui/status-dot';
import { ThinkingTrace, type TraceStep } from '@/components/ui/thinking-trace';
import { cn } from '@/lib/utils';

const AGENTS = [
  { name: 'Inbox triage', tone: '#ffffff', on: true },
  { name: 'Weekly planner', tone: '#ffd7a8' },
  { name: 'Support bot', tone: '#9fc2e0' },
  { name: 'Lead finder', tone: '#f3c2b0' },
];

const STEPS: TraceStep[] = [
  { id: '1', label: 'Read 12 new emails', tool: 'Gmail: search', status: 'done' },
  { id: '2', label: 'Picked out 3 from clients', status: 'done' },
  { id: '3', label: 'Drafted 2 replies', tool: 'Gmail: draft', status: 'done' },
  { id: '4', label: 'Waiting for your approval to send 1 reply', tool: 'Gmail: send', status: 'running' },
];

// Browser mockup overlapping the bottom of the hero: only the frame is glass
// (10px glass border around a dark screen). Static demo content; only the trace toggles.
function ProductShot() {
  return (
    <BlurFade delay={0.48} className="relative z-[2] mx-auto -mt-[170px] max-w-[1120px] px-4 sm:px-6 lg:px-12">
      <figure className="m-0">
        <figcaption className="sr-only">
          Agent Studio chat: an inbox agent reports its steps and waits for approval before sending a reply.
        </figcaption>
        <div
          className="rounded-[30px] border border-white/45 bg-linear-to-b from-white/22 to-white/8 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-[20px] backdrop-saturate-[1.7]"
        >
          <div className="flex items-center gap-3 px-2.5 pt-1.5 pb-3">
            <span className="inline-flex gap-[7px]">
              <i className="size-[11px] rounded-full bg-white/55" />
              <i className="size-[11px] rounded-full bg-white/55" />
              <i className="size-[11px] rounded-full bg-white/55" />
            </span>
            <span className="flex h-[30px] min-w-0 flex-1 items-center gap-2 rounded-pill bg-night/35 px-3.5 text-[13px] text-white/85">
              <Lock className="size-3 shrink-0" strokeWidth={1.7} />
              <span className="truncate">agentstudio.app/chat/inbox-triage</span>
            </span>
          </div>
          <div className="grid min-h-[520px] overflow-hidden rounded-[20px] bg-[#0f141c] md:grid-cols-[240px_1fr]">
            <div className="hidden flex-col gap-1.5 border-r border-white/10 p-[18px] md:flex">
              <span className="mt-1 mb-2 text-xs tracking-[0.08em] text-white/66 uppercase">Your agents</span>
              {AGENTS.map((a) => (
                <span
                  key={a.name}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[14px] px-2.5 py-[9px] text-sm',
                    a.on ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]' : 'text-white/75'
                  )}
                >
                  <LogoMark size={28} tone={a.tone} />
                  {a.name}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-center bg-sky-dusk p-4 sm:p-7">
              <div className="sky-glass flex w-full max-w-[640px] flex-col gap-3.5 rounded-[30px] p-4 sm:p-[22px]">
                <div className="flex items-center gap-3 border-b border-white/22 pb-3.5">
                  <LogoMark size={38} />
                  <div className="flex flex-col">
                    <b className="font-semibold">Inbox triage</b>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/85">
                      <StatusDot status="live" />
                      Online
                    </span>
                  </div>
                  <Badge status="live" className="ml-auto hidden sm:inline-flex">
                    Gmail connected
                  </Badge>
                </div>
                <div className="max-w-[78%] self-end rounded-[20px_20px_6px_20px] border border-white bg-white px-4 py-[11px] text-[15px] leading-[22px] text-on-white">
                  Draft replies to anything from clients today.
                </div>
                <ThinkingTrace steps={STEPS} defaultOpen />
                <div className="max-w-[78%] rounded-[20px_20px_20px_6px] border border-white/20 bg-night/35 px-4 py-[11px] text-[15px] leading-[22px]">
                  Found 3 client emails. Two drafts are saved. One reply needs your OK before it goes out.
                </div>
                <div className="flex items-center gap-2 rounded-pill border border-white/30 bg-night/30 py-[5px] pr-[5px] pl-[18px]">
                  <span className="flex-1 text-[15px] text-white/65">Message Inbox triage…</span>
                  <span className="inline-grid size-10 place-items-center rounded-pill bg-white text-on-white">
                    <ArrowUp className="size-4" strokeWidth={1.7} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </figure>
    </BlurFade>
  );
}

export default ProductShot;
