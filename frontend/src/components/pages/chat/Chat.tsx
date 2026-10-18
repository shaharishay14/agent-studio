import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AgentSidebar, ChatArea, ChatLayout } from './components';
import { CreateTriggerModal } from './components/modals';
import { ResetMemoryModal, ShareAgentModal, TelegramBotModal } from '../../shared/modals';
import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { useGetAgent, useGetAvailableAgentTools, useGetAgentMessages, useGetSuggestedPrompts } from './hooks';
import { LoadingState, ErrorState } from '../../shared/components';

function Chat() {
  const { isDarkMode } = useDarkModeStore();
  const { id } = useParams<{ id: string }>();
  
  // בדוק אם אנחנו ב-mobile בהתחלה - ב-mobile ה-sidebar סגור כברירת מחדל
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return true; // fallback for SSR
  });

  // עדכן את המצב כשגודל המסך משתנה
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // ב-desktop, פתח את ה-sidebar כברירת מחדל
        setIsSidebarOpen(true);
      } else {
        // ב-mobile, סגור את ה-sidebar
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // שליפת נתוני האייג'נט
  const { agent, isLoading, isError } = useGetAgent(id || '');
  
  // שליפת הכלים הזמינים של האייג'נט - יודפס ב-console
  useGetAvailableAgentTools(id || '');
  
  // שליפת הודעות האייג'נט
  const { messages } = useGetAgentMessages(id || '');
  // hook להצעות פרומפטים - מטפל באופן אוטומטי בקבלת הצעות
  const { suggestedPrompts } = useGetSuggestedPrompts(messages, agent);
  // Modal state
  const { createTriggerModal, closeCreateTriggerModal } = useModalsStore();

  // הצגת loading
  if (isLoading) {
    return (
      <ChatLayout isDarkMode={isDarkMode}>
        <LoadingState />
      </ChatLayout>
    );
  }

  // הצגת שגיאה
  if (isError) {
    return (
      <ChatLayout isDarkMode={isDarkMode}>
        <ErrorState message="Error loading agent" />
      </ChatLayout>
    );
  }

  return (
    <>
      <ChatLayout isDarkMode={isDarkMode}>
        {/* Agent Settings Sidebar */}
        <AgentSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          agent={agent}
        />
        
        {/* Chat Area */}
        <div className={`flex-1 ${isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
          <ChatArea 
            agentId={id || ''}
            agent={agent}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            suggestedPrompts={suggestedPrompts}
          />
        </div>
      </ChatLayout>

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

