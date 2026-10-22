import { Clock, FileText, Github, Plug, RefreshCw, Share2, ShieldCheck, Workflow } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Plug, title: 'Connect your tools', body: 'Gmail, WhatsApp, Telegram and more. Your agent picks the right one for each step.' },
  { icon: FileText, title: 'Give it your files', body: 'Upload docs and playbooks. The agent reads them before it answers.' },
  { icon: Clock, title: 'Run on a schedule', body: 'Every morning, every Friday, or the moment a new email lands.' },
  { icon: ShieldCheck, title: 'Ask before acting', body: 'Sends, posts and deletes wait for your approval, with the exact details.' },
  { icon: Workflow, title: 'Chain agents', body: "Build a workflow where one agent's answer feeds the next." },
  { icon: Share2, title: 'Share it anywhere', body: 'A link, a QR code, an embed, or a bot on WhatsApp and Telegram.' },
  { icon: RefreshCw, title: 'Reset memory anytime', body: 'Clear what an agent remembers in one click. Files and tools stay connected.' },
  { icon: Github, title: 'Open source', body: 'The whole app is on GitHub. Read it, run it, change it.' },
];

// 4×2 feature grid on a solid night panel. Hover: left bar grows and turns white,
// title slides 8px, soft gradient fill.
function Features() {
  return (
    <section id="features" className="scroll-mt-6 px-4 pt-10 pb-24 sm:px-6 lg:px-12 lg:pb-[120px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading eyebrow="Features" title="Everything an agent needs to do" accent="real work" />
        <BlurFade inView>
          <div className="grid overflow-hidden rounded-card border border-white/12 bg-night-2 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <article
                key={title}
                data-row={i < 4 ? 1 : 2}
                className={cn(
                  'sky-feature relative isolate flex flex-col gap-3.5 overflow-hidden px-[30px] pt-10 pb-11',
                  'border-white/10 max-lg:border-b sm:max-lg:odd:border-r lg:not-nth-[4n]:border-r lg:nth-[-n+4]:border-b'
                )}
              >
                <Icon className="size-5 text-white/80" strokeWidth={1.7} aria-hidden="true" />
                <h3 className="relative m-0 font-display text-[19px] leading-[26px] font-medium tracking-[-0.015em]">
                  <span className="sky-feature-bar absolute top-1/2 -left-[30px] h-6 w-1 -translate-y-1/2 rounded-r bg-white/25" aria-hidden="true" />
                  <span className="sky-feature-title inline-block">{title}</span>
                </h3>
                <p className="m-0 text-[15px] leading-[23px] text-white/72">{body}</p>
              </article>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

export default Features;
