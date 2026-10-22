import { Link } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button, buttonVariants } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';
import { useUserStore } from '../../../../../../store/user.store';

const FREE_FEATURES = [
  // TODO: replace [MONTHLY CREDITS] with the real monthly credit amount
  '[MONTHLY CREDITS] credits each month',
  'Agents, tools, files and triggers',
  'Workflows',
  'Share by link, QR code and embed',
];

const priceTitle = 'm-0 font-display text-[40px] leading-10 font-medium tracking-[-0.035em]';
const priceAmount = 'm-0 font-display text-[64px] leading-16 font-medium tracking-[-0.035em]';
const card = 'sky-glass flex flex-[1_1_320px] flex-col gap-[22px] rounded-[30px] p-2.5 pb-6';

// Glass cards on the dimmed clouds photo. Free card header shows the photo behind "Free / $0".
// Pro is "Coming soon" and disabled.
function Pricing() {
  const { isAuthenticated } = useUserStore();

  return (
    <section id="pricing" className="scroll-mt-6 px-4 pt-10 pb-24 sm:px-6 lg:px-12 lg:pb-[120px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading eyebrow="Pricing" title="Start" accent="free" />
        <BlurFade inView>
          <div className="rounded-card bg-[linear-gradient(rgba(10,14,20,0.55),rgba(10,14,20,0.55)),url(/assets/sky/sky-clouds.webp)] bg-dusk bg-cover bg-center p-4 sm:p-12">
            <div className="flex flex-wrap items-stretch gap-6">
              <article className={card}>
                <div className="flex min-h-[190px] flex-col items-start justify-end gap-2 rounded-inner bg-[linear-gradient(180deg,rgba(10,14,20,0)_30%,rgba(10,14,20,0.45)),url(/assets/sky/sky-clouds.webp)] bg-dusk bg-cover bg-[center_70%] p-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]">
                  <Badge>Available now</Badge>
                  <h3 className={priceTitle}>Free</h3>
                  <p className={priceAmount}>$0</p>
                </div>
                <ul className="mx-[18px] my-0 flex list-none flex-col gap-3 p-0 text-[15px] text-white/85">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={isAuthenticated ? '/builder' : '/auth/signup'}
                  className={cn(buttonVariants({ variant: 'white', block: true }), 'mx-[18px] mt-auto w-auto')}
                >
                  Create your first agent
                </Link>
              </article>

              <article className={card}>
                <div className="flex min-h-[190px] flex-col items-start justify-end gap-2 rounded-inner bg-white/5 p-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]">
                  <Badge dim>
                    <Lock />
                    Coming soon
                  </Badge>
                  <h3 className={priceTitle}>Pro</h3>
                  {/* TODO: replace [PRICE] */}
                  <p className={`${priceAmount} text-white/55`}>[PRICE]</p>
                </div>
                {/* TODO: replace [PRO DETAILS] */}
                <p className="mx-[18px] my-0 text-white/72">For agents that run all day. [PRO DETAILS]</p>
                <Button variant="glass" block disabled className="mx-[18px] mt-auto w-auto">
                  Coming soon
                </Button>
              </article>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

export default Pricing;
