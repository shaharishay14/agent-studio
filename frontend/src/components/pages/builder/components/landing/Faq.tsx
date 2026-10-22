import { BlurFade } from '@/components/ui/blur-fade';
import { FaqScroller } from '@/components/ui/faq-scroller';
import { SectionHeading } from '@/components/ui/section-heading';
import { faqData } from '../../constants/faqData';

function Faq() {
  return (
    <section id="faq" className="scroll-mt-6 px-4 pt-10 pb-24 sm:px-6 lg:px-12 lg:pb-[120px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading eyebrow="FAQ" title="Questions," accent="answered" />
        <BlurFade inView>
          <FaqScroller items={faqData} />
        </BlurFade>
      </div>
    </section>
  );
}

export default Faq;
