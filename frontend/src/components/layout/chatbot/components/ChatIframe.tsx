import { useState } from 'react';
import ChatLoader from './ChatLoader';

function ChatIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const chatUrl = import.meta.env.VITE_SUPPORT_AGENT_URL;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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

