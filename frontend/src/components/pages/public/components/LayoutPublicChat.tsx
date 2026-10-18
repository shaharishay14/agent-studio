interface LayoutPublicChatProps {
  children: React.ReactNode;
}

function LayoutPublicChat({ children }: LayoutPublicChatProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-0 sm:p-6">
      {/* Main Frame - Contains Everything */}
      <div className="relative max-w-7xl w-full h-screen sm:h-[95vh] flex flex-col rounded-none sm:rounded-3xl bg-gradient-to-br from-gray-900/40 to-gray-800/30 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Content */}
        {children}
      </div>
    </div>
  );
}

export default LayoutPublicChat;

