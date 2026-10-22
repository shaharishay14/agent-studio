import { useUserStore } from '../../../../store/user.store';
import Hero from './components/landing/Hero';
import ProductShot from './components/landing/ProductShot';
import HowItWorks from './components/landing/HowItWorks';
import Features from './components/landing/Features';
import IntegrationsSection from './components/landing/IntegrationsSection';
import Pricing from './components/landing/Pricing';
import Faq from './components/landing/Faq';
import ClosingCta from './components/landing/ClosingCta';
import LandingFooter from './components/landing/LandingFooter';
import YourAgents from './components/landing/YourAgents';

// Landing (logged out) and home (logged in). Logged-in users get the hero prompt box and their
// agents; everyone else gets the full landing page.
function Builder() {
  const { isAuthenticated } = useUserStore();

  return (
    <div className="min-h-screen overflow-x-hidden bg-night text-white">
      <Hero withShot={!isAuthenticated} />
      {isAuthenticated ? (
        <YourAgents />
      ) : (
        <>
          <ProductShot />
          <HowItWorks />
          <Features />
          <IntegrationsSection />
          <Pricing />
          <Faq />
          <ClosingCta />
          <LandingFooter />
        </>
      )}
    </div>
  );
}

export default Builder;
