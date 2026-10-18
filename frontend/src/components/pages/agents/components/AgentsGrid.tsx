import type { Agent } from '../types';
import AgentCard from './AgentCard';
import { ScaleIn } from '../../../shared/animation';

interface AgentsGridProps {
  agents: Agent[];
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
}

function AgentsGrid({ agents, onDelete }: AgentsGridProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {agents.map((agent, index) => (
          <ScaleIn
            key={agent.id}
            delay={index * 0.1}
            duration={0.6}
            scale={0.8}
            springy={true}
          >
            <AgentCard
              agent={agent}
              onDelete={onDelete}
            />
          </ScaleIn>
        ))}
      </div>
    </div>
  );
}

export default AgentsGrid;

