// import { formatAvatarUrl } from '../../chat/utils';

interface Agent {
  name: string;
  avatar_base64?: string | null;
}

interface PublicChatWelcomeProps {
  agent: Agent;
}

function PublicChatWelcome({ agent }: PublicChatWelcomeProps) {
  // const avatarUrl = formatAvatarUrl(agent.avatar_base64);
  return (
    <div className="text-center py-12">
      <img 
        src={"/assets/agent.png"} 
        alt={agent?.name || "Agent"} 
        className="w-16 h-16 mx-auto mb-4 object-contain"
      />
      <h2 className="text-2xl font-bold mb-2 text-white">
        {agent?.name || 'Agent'}
      </h2>
      <p className="mb-8 text-gray-400">
        Start chatting with your agent
      </p>
    </div>
  );
}

export default PublicChatWelcome;

