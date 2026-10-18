import { useState } from 'react';
import { FloatingButton, ChatWindow } from './chatbot/components';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && <FloatingButton onClick={() => setIsOpen(true)} />}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
}

export default Chatbot;

