interface LayoutPublicChatProps {
  children: React.ReactNode;
}

// Full-screen dusk photo with a night tint, same as the agent chat
function LayoutPublicChat({ children }: LayoutPublicChatProps) {
  return (
    <div className="flex h-dvh flex-col bg-[#1a2a48] bg-[linear-gradient(rgba(10,14,20,0.3),rgba(10,14,20,0.3)),url(/assets/sky/sky-dusk.webp)] bg-cover bg-center text-white">
      {children}
    </div>
  );
}

export default LayoutPublicChat;
