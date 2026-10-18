import useDarkModeStore from '../../../../../store/darkmode.store';
import ChatHeader from './ChatHeader';
import ChatIframe from './ChatIframe';

interface ChatWindowProps {
  onClose: () => void;
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div
      className={`fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[1000px] md:h-[720px] md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden ${
        isDarkMode
          ? 'bg-gray-900 border-0 md:border border-gray-700'
          : 'bg-white border-0 md:border border-gray-200'
      }`}
    >
      <ChatHeader onClose={onClose} />
      <ChatIframe />
    </div>
  );
}

export default ChatWindow;

