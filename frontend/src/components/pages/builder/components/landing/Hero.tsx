import { BlurFade } from '@/components/ui/blur-fade';
import { Eyebrow } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';
import { LandingNav } from '../../../../sky/LandingNav';
import HeroPrompt from './HeroPrompt';

// Full-bleed sky-clouds photo with a dark top/bottom fade. Eyebrow, headline, lead, prompt box
// and chips blur-fade in one after another (120ms apart).
function Hero({ withShot }: { withShot: boolean }) {
  return (
    <section
      id="top"
      className={cn(
        'relative flex flex-col bg-sky-clouds px-4 pt-[22px] sm:px-6',
        withShot ? 'min-h-[940px]' : 'min-h-[760px]'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,20,0.3),rgba(10,14,20,0)_35%,rgba(10,14,20,0.15)_70%,#0a0e14_100%)]"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <LandingNav />
      </div>
      <div
        className={cn(
          'relative z-[1] flex flex-1 flex-col items-center justify-center gap-6 pt-16 text-center sm:pt-20',
          withShot ? 'pb-[200px]' : 'pb-24'
        )}
      >
        <BlurFade>
          <Eyebrow>Open-source agent builder</Eyebrow>
        </BlurFade>
        <BlurFade delay={0.12}>
          <h1 className="m-0 font-display text-[46px] leading-[48px] font-medium tracking-[-0.045em] [text-shadow:0_2px_30px_rgba(10,14,20,0.35)] sm:text-[64px] sm:leading-[66px] lg:text-[88px] lg:leading-[88px]">
            Describe an agent.
            <br />
            <em className="sky-serif text-[1.05em]">Watch it work.</em>
          </h1>
        </BlurFade>
        <BlurFade delay={0.24}>
          <p className="m-0 max-w-[48ch] text-[17px] leading-7 text-white/85 [text-shadow:0_1px_12px_rgba(10,14,20,0.45)] sm:text-[19px] sm:leading-[30px]">
            Write one sentence. Agent Studio picks the tools, reads your files, runs on a schedule, and asks before it
            sends anything for you.
          </p>
        </BlurFade>
        <HeroPrompt startDelay={0.36} />
      </div>
    </section>
  );
}

export default Hero;
