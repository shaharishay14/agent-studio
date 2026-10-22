import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ThinkingOrb } from '@/components/ui/thinking-trace';
import { StatusScreen } from '../../sky/StatusScreen';

function AgentLoading() {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for the new agent's data in sessionStorage
    const checkAgentData = setInterval(() => {
      const storedData = sessionStorage.getItem('newAgentData');
      if (storedData) {
        // Found it: wait 2 seconds, then go to the summary page
        clearInterval(checkAgentData);
        setTimeout(() => {
          navigate('/agent-summary');
        }, 2000);
      }
    }, 100);

    // Stop checking on unmount
    return () => clearInterval(checkAgentData);
  }, [navigate]);

  return (
    <StatusScreen>
      <span className="mb-4 grid size-[72px] place-items-center" aria-hidden="true">
        <ThinkingOrb className="scale-[2.6]" />
      </span>
      <h1 className="m-0 font-display text-[28px] leading-8 font-medium tracking-[-0.03em]">
        Creating <em className="sky-serif">your agent</em>
      </h1>
      <p className="sky-shimmer m-0 text-[15px]" role="status">
        Reading what you asked for…
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-pill bg-white/12" aria-hidden="true">
        <div className="sky-progress h-full rounded-pill bg-white" />
      </div>
      <p className="m-0 text-[13px] text-white/60">This usually takes a few seconds.</p>
    </StatusScreen>
  );
}

export default AgentLoading;
