import HeroSection from './components/HeroSection';
import BuilderSection from './components/BuilderSection';
import CapabilitiesSection from './components/CapabilitiesSection';
import WhyChooseSection from './components/WhyChooseSection';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import { useUserStore } from '../../../../store/user.store';
import AgentsSection from './components/AgentsSection';
import { LayoutBuilder } from '../../shared/components';
import { NeuralNetworkBackground, Spotlight } from './components/backgrounds';
import { ScrollFadeIn } from '../../shared/animation';

function Builder() {
  const { isAuthenticated } = useUserStore();

  return (
    <LayoutBuilder>
      {/* Neural Network Background */}
      <NeuralNetworkBackground />
      
      {/* Center Spotlight */}
      <Spotlight />
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 min-h-screen">
        {/* Hero - has internal animations */}
        <HeroSection />
        
        {/* Builder - has internal animations */}
        <BuilderSection />
        
        {/* If authenticated, show agents section */}
        {isAuthenticated && (
          <ScrollFadeIn>
            <AgentsSection />
          </ScrollFadeIn>
        )}
        
        {/* If not authenticated, show why choose and capabilities sections */}
        {!isAuthenticated && (
          <>
            <ScrollFadeIn>
              <WhyChooseSection />
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.2}>
              <CapabilitiesSection />
            </ScrollFadeIn>
          </>
        )}
        
        {/* Additional sections */}
        <ScrollFadeIn>
          <PricingSection />
        </ScrollFadeIn>
        
        <ScrollFadeIn delay={0.2}>
          <FAQSection />
        </ScrollFadeIn>
      </div>
    </LayoutBuilder>
  );
}

export default Builder;