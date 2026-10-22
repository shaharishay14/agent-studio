import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AgentList, AgentSidebar, ChatArea } from './components';
import { CreateTriggerModal } from './components/modals';
import { ResetMemoryModal, ShareAgentModal, TelegramBotModal } from '../../shared/modals';
import useModalsStore from '../../../../store/modals.store';
import { useGetAgent, useGetAvailableAgentTools, useGetAgentMessages, useGetSuggestedPrompts } from './hooks';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Height under the 61px app top bar. The dusk photo gets a 30% night tint so text and the
// glass Deny button stay readable over its brightest (orange) corner.
const fullHeight = 'h-[calc(100dvh-61px)]';

function Chat() {
  const { id } = useParams<{ id: string }>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // שליפת נתוני האייג'נט
  const { agent, isLoading, isError } = useGetAgent(id || '');

  // שליפת הכלים הזמינים של האייג'נט
  useGetAvailableAgentTools(id || '');

  // שליפת הודעות האייג'נט
  const { messages } = useGetAgentMessages(id || '');
  // hook להצעות פרומפטים - מטפל באופן אוטומטי בקבלת הצעות
  const { suggestedPrompts } = useGetSuggestedPrompts(messages, agent);
  // Modal state
  const { createTriggerModal, closeCreateTriggerModal } = useModalsStore();

  return (
    <>
      <div className={`grid ${fullHeight} lg:grid-cols-[280px_minmax(0,1fr)]`}>
        <AgentList />

        <div className="flex min-h-0 min-w-0">
          <main className="relative min-h-0 min-w-0 flex-1 bg-[#1a2a48] bg-[linear-gradient(rgba(10,14,20,0.3),rgba(10,14,20,0.3)),url(/assets/sky/sky-dusk.webp)] bg-cover bg-center">
            {isLoading && (
              <div className="grid h-full place-items-center">
                <Spinner label="Loading agent" />
              </div>
            )}

            {isError && (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
                <h1 className="m-0 font-display text-2xl font-medium tracking-[-0.02em]">We couldn't open this agent</h1>
                <p className="m-0 max-w-[40ch] text-white/80">It may have been deleted, or the link is wrong.</p>
                <Link to="/agents" className={buttonVariants({ variant: 'white', size: 'sm' })}>
                  Back to your agents
                </Link>
              </div>
            )}

            {!isLoading && !isError && (
              <ChatArea
                agentId={id || ''}
                agent={agent}
                isSettingsOpen={isSettingsOpen}
                onToggleSettings={() => setIsSettingsOpen((open) => !open)}
                suggestedPrompts={suggestedPrompts}
              />
            )}
          </main>

          {!isLoading && !isError && (
            <AgentSidebar isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} agent={agent} />
          )}
        </div>
      </div>

      {/* Create Trigger Modal - Positioned at Chat level for full screen coverage */}
      <CreateTriggerModal
        isOpen={createTriggerModal.isOpen}
        onClose={closeCreateTriggerModal}
        agentId={createTriggerModal.agentId || undefined}
      />

      {/* Reset Memory Modal */}
      <ResetMemoryModal />

      {/* Share Agent Modal */}
      <ShareAgentModal />

      {/* Telegram Bot Modal */}
      <TelegramBotModal />
    </>
  );
}

export default Chat;
