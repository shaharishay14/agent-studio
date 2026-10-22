import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { buttonVariants } from '@/components/ui/button';
import { useUserStore } from '../../../../../../store/user.store';
import { GITHUB_URL } from './links';

// Glass frame (12px) around the sky-clouds photo blurred 14px.
function ClosingCta() {
  const { isAuthenticated } = useUserStore();

  return (
    <section className="px-4 pt-10 pb-16 sm:px-6 lg:px-12">
      <BlurFade inView className="mx-auto max-w-[1280px]">
        <div className="relative rounded-[36px] border border-white/45 bg-linear-to-b from-white/22 to-white/7 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="absolute inset-3 overflow-hidden rounded-[26px] bg-sky-clouds blur-[14px] saturate-[1.15]" aria-hidden="true" />
          <div className="relative flex min-h-[460px] flex-col items-center justify-center gap-[30px] overflow-hidden rounded-[26px] bg-night/22 px-6 py-12 text-center">
            <h2 className="m-0 max-w-[14ch] font-display text-[44px] leading-[46px] font-medium tracking-[-0.035em] sm:text-[64px] sm:leading-16">
              Your first agent is <em className="sky-serif">one sentence away.</em>
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link to={isAuthenticated ? '/builder' : '/auth/signup'} className={buttonVariants({ variant: 'white', size: 'lg' })}>
                Create an agent
              </Link>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'glass', size: 'lg' })}>
                <Github />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </BlurFade>
    </section>
  );
}

export default ClosingCta;
