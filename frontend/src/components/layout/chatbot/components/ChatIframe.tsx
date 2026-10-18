import { useState } from 'react';
import ChatLoader from './ChatLoader';

function ChatIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const chatUrl = import.meta.env.VITE_SUPPORT_AGENT_URL;

  return (
    <div className="flex-1 overflow-hidden relative flex flex-col chat-scrollbar">
      {isLoading && <ChatLoader />}
      <iframe 
        src={chatUrl}
        width="100%" 
        height="100%" 
        style={{ border: 'none', display: isLoading ? 'none' : 'block' }}
        title="Chat with Agent Studio support agent"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

export default ChatIframe;

