import { Link } from 'react-router-dom';
import { Github, Mail } from 'lucide-react';

import { StackedCircularFooter, type FooterSocial } from '@/components/ui/stacked-circular-footer';
import { GITHUB_URL, SUPPORT_EMAIL } from './links';

const LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'GitHub', href: GITHUB_URL, external: true },
];

// Only the accounts that exist: GitHub, and email when the support address is configured.
const SOCIALS: FooterSocial[] = [
  { label: 'GitHub', href: GITHUB_URL, icon: <Github /> },
  ...(SUPPORT_EMAIL ? [{ label: 'Email', href: `mailto:${SUPPORT_EMAIL}`, icon: <Mail /> }] : []),
];

function LandingFooter() {
  return (
    <div className="px-4 pb-12 sm:px-6 lg:px-12">
      <StackedCircularFooter
        className="mx-auto max-w-[1280px]"
        links={LINKS}
        socials={SOCIALS}
        legal={
          <>
            © {new Date().getFullYear()} Agent Studio ·{' '}
            <Link to="/terms-of-service" className="text-white/78 hover:text-white">
              Terms of service
            </Link>{' '}
            ·{' '}
            <Link to="/privacy-policy" className="text-white/78 hover:text-white">
              Privacy policy
            </Link>
          </>
        }
      />
    </div>
  );
}

export default LandingFooter;
