import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { FileText } from 'lucide-react';

import { AnimatedBeam } from '@/components/ui/animated-beam';
import { ApprovalCard } from '@/components/ui/approval-card';
import { BrandIcon } from '@/components/ui/brand-icon';
import { LogoMark } from '@/components/ui/logo';
import { PromptGlowFrame, PromptSend, PromptToggle, PROMPT_MODES } from '@/components/ui/prompt-box';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Status } from '@/components/ui/status-dot';
import { cn } from '@/lib/utils';

const TYPED = 'An agent that reads my inbox every morning and drafts replies to anything from clients.';

/** true once the element is 35% visible (stays true) */
function useInViewOnce<T extends Element>(ref: RefObject<T | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, inView]);
  return inView;
}

function Step({
  id,
  title,
  body,
  flip,
  artClassName,
  children,
}: {
  id?: string;
  title: string;
  body: string;
  flip?: boolean;
  artClassName?: string;
  children: (active: boolean) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const active = useInViewOnce(ref);
  return (
    <article
      ref={ref}
      id={id}
      className={cn(
        'grid scroll-mt-6 items-center gap-8 rounded-card border border-white/12 bg-night-2 p-[22px] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:p-9',
        'transition-[opacity,filter,transform] duration-900 ease-sky motion-reduce:transition-none',
        active ? 'opacity-100 blur-none' : 'translate-y-7 opacity-0 blur-[10px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none'
      )}
    >
      <div className={cn('flex flex-col gap-3.5', flip && 'lg:order-2')}>
        <h3 className="m-0 font-display text-[28px] leading-8 font-medium tracking-[-0.03em] lg:text-[34px] lg:leading-[38px]">{title}</h3>
        <p className="m-0 text-[17px] leading-[27px] text-white/72">{body}</p>
      </div>
      <div className={cn('grid min-h-[300px] place-items-center rounded-inner lg:min-h-[340px]', artClassName)}>{children(active)}</div>
    </article>
  );
}

// Describe it: the prompt types itself (45ms a letter), pauses, then starts over.
function TypedPrompt({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    const t = window.setInterval(() => setN((c) => (c >= TYPED.length + 50 ? 0 : c + 1)), 45);
    return () => window.clearInterval(t);
  }, [active, reduce]);
  const shown = reduce ? TYPED : TYPED.slice(0, Math.min(n, TYPED.length));

  return (
    <PromptGlowFrame glowOpacity={0.55} className="max-w-[520px]">
      <p className="m-0 min-h-14 px-1.5 py-1 text-lg leading-7 text-white" aria-label={TYPED}>
        <span aria-hidden="true">{shown}</span>
        <span className="sky-caret" aria-hidden="true" />
      </p>
      <div className="mt-2.5 flex items-center gap-1.5" aria-hidden="true">
        <PromptToggle on icon={PROMPT_MODES[0].icon} label={PROMPT_MODES[0].label} />
        <PromptSend label="Create agent" demo />
      </div>
    </PromptGlowFrame>
  );
}

const APPS: { name: string; label: string }[] = [
  { name: 'Gmail', label: 'Gmail' },
  { name: 'Google Calendar', label: 'Calendar' },
  { name: 'Google Drive', label: 'Drive' },
  { name: 'WhatsApp', label: 'WhatsApp' },
  { name: 'Telegram', label: 'Telegram' },
  { name: 'Files', label: 'Files' },
];

// Left column top to bottom, then right column
const POS = [
  { left: '12.5%', top: '17.647%', curvature: 40 },
  { left: '12.5%', top: '50%', curvature: 0 },
  { left: '12.5%', top: '82.353%', curvature: -40 },
  { left: '87.5%', top: '17.647%', curvature: 40 },
  { left: '87.5%', top: '50%', curvature: 0 },
  { left: '87.5%', top: '82.353%', curvature: -40 },
];

// Connect your tools: beams from six solid app circles into the agent. The circles are solid
// (night-3) so the beams start at their edge.
function ToolBeams({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLSpanElement>(null);
  const nodeRefs = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];

  return (
    <div ref={containerRef} className="relative aspect-[560/340] w-full max-w-[560px]" role="img" aria-label="Gmail, Calendar, Drive, WhatsApp, Telegram and files connected to your agent">
      {active &&
        nodeRefs.map((ref, i) => (
          <AnimatedBeam
            key={i}
            containerRef={containerRef}
            fromRef={ref}
            toRef={coreRef}
            curvature={POS[i].curvature}
            reverse={i >= 3}
            delay={i * 0.4}
          />
        ))}
      {APPS.map((app, i) => (
        <span
          key={app.name}
          className="absolute z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: POS[i].left, top: POS[i].top }}
          aria-hidden="true"
        >
          <span
            ref={nodeRefs[i]}
            className="grid size-11 place-items-center rounded-pill border border-white/32 bg-night-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-8px_rgba(0,0,0,0.7)] sm:size-[58px]"
          >
            <BrandIcon name={app.name} size={20} fallback={FileText} />
          </span>
          <small className="absolute top-[calc(100%+6px)] text-xs whitespace-nowrap text-white/66 max-sm:hidden">{app.label}</small>
        </span>
      ))}
      <span
        ref={coreRef}
        className="absolute top-1/2 left-1/2 z-[1] grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border border-white/40 bg-night-3 shadow-[0_0_0_10px_rgba(255,255,255,0.04),0_0_60px_rgba(230,176,109,0.35)] sm:size-[92px]"
        aria-hidden="true"
      >
        <LogoMark size={52} className="max-sm:scale-[0.77]" />
      </span>
    </div>
  );
}

const APPROVAL_PHASES: { title: string; status: Status; badge: string; pressed?: boolean; done?: boolean }[] = [
  { title: 'Waiting for your approval', status: 'busy', badge: 'Expires in 2:41' },
  { title: 'Waiting for your approval', status: 'busy', badge: 'Expires in 2:40', pressed: true },
  { title: 'Approved, sending…', status: 'busy', badge: 'Sending' },
  { title: 'Sent to Dana', status: 'live', badge: 'Done', done: true },
];

// Approve and let it run: waiting -> Approve pressed -> "Approved, sending…" -> "Sent to Dana", every 1.5s.
function ApprovalLoop({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    const t = window.setInterval(() => setPhase((p) => (p + 1) % APPROVAL_PHASES.length), 1500);
    return () => window.clearInterval(t);
  }, [active, reduce]);
  const p = APPROVAL_PHASES[phase];

  return (
    <div className="w-full" aria-hidden="true">
      <ApprovalCard
        demo
        className="mx-auto"
        title={p.title}
        status={p.status}
        badge={p.badge}
        pressed={p.pressed}
        done={p.done}
        toolIcon={<BrandIcon name="Gmail" size={16} />}
        toolName="Gmail: send email"
        toolDetail="To dana@northwind.co"
        preview="Hi Dana, thanks for the quick reply. Tuesday at 10:00 works for us…"
      />
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-6 px-4 py-24 sm:px-6 lg:px-12 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading eyebrow="How it works" title="From one sentence to a" accent="working agent" />
        <div className="flex flex-col gap-7">
          <Step
            title="Describe it"
            body="Say what the agent should do in plain words. YOLO mode picks the tools and prompt for you; Manual mode lets you set every part."
          >
            {(active) => <TypedPrompt active={active} />}
          </Step>
          <Step
            flip
            title="Connect your tools"
            body="Sign in once to Gmail, Calendar, WhatsApp and more. Your agent only reaches for a tool when the job calls for it."
          >
            {(active) => <ToolBeams active={active} />}
          </Step>
          <Step
            id="how-approve"
            title="Approve and let it run"
            body="Chat with it, schedule it, or start it from an app event. Anything that sends, posts or deletes waits for your OK."
            artClassName="bg-sky-dusk p-3 sm:p-10"
          >
            {(active) => <ApprovalLoop active={active} />}
          </Step>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
