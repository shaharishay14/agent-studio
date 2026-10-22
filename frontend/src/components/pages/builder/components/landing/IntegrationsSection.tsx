import { Link } from 'react-router-dom';

import { BlurFade } from '@/components/ui/blur-fade';
import { buttonVariants } from '@/components/ui/button';
import { IntegrationsCluster } from '@/components/ui/integrations-cluster';
import { cn } from '@/lib/utils';

// The tools the honeycomb cycles through, six at a time
const TOOLS = [
  'Gmail', 'Google Calendar', 'Google Drive', 'WhatsApp', 'Telegram', 'Google Sheets', 'Google Docs', 'Slack',
  'Notion', 'GitHub', 'Outlook', 'Discord', 'Trello', 'Asana', 'HubSpot', 'Jira', 'Linear', 'Dropbox', 'Zoom',
  'Airtable', 'Shopify', 'Stripe', 'Salesforce', 'Calendly', 'Figma', 'X', 'LinkedIn', 'YouTube', 'Todoist',
  'Mailchimp', 'Intercom',
];

function IntegrationsSection() {
  return (
    <section id="integrations" className="px-4 pt-10 pb-24 sm:px-6 lg:px-12 lg:pb-[120px]">
      <BlurFade inView className="mx-auto max-w-[1280px]">
        <div className="grid items-center gap-14 overflow-hidden rounded-card border border-white/12 bg-night px-6 py-12 xl:grid-cols-2 xl:px-14 xl:py-24">
          <IntegrationsCluster tools={TOOLS} />
          <div className="flex flex-col gap-7">
            <h2 className="m-0 font-display text-[38px] leading-[42px] font-semibold tracking-[-0.035em] lg:text-[60px] lg:leading-16">
              Plug in the tools you already use
            </h2>
            {/* TODO: replace [NUMBER] with the real integration count */}
            <p className="m-0 max-w-[34ch] text-[19px] leading-[30px] text-white/72">
              Connect Gmail, WhatsApp, Telegram and [NUMBER]+ more. Sign in once and every agent can use them.
            </p>
            <Link to="/integrations" className={cn(buttonVariants({ variant: 'white' }), 'self-start')}>
              Get started
            </Link>
          </div>
        </div>
      </BlurFade>
    </section>
  );
}

export default IntegrationsSection;
