import { useEffect, useState } from 'react';
import type { ToolApprovalRequest, ApprovalDecision } from '../types';

interface ApprovalCardProps {
  isDarkMode: boolean;
  approval: ToolApprovalRequest;
  isDeciding: boolean;
  onDecision: (decision: ApprovalDecision) => void;
}

// GMAIL_SEND_EMAIL -> "Gmail · Send email"
const formatToolName = (tool: string) => {
  const [app, ...rest] = tool.split('_');
  const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (rest.length === 0) return capitalize(app);
  return `${capitalize(app)} · ${capitalize(rest.join(' '))}`;
};

const formatValue = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

export const ApprovalCard = ({ isDarkMode, approval, isDeciding, onDecision }: ApprovalCardProps) => {
  const [secondsLeft, setSecondsLeft] = useState(approval.timeout_seconds);

  useEffect(() => {
    setSecondsLeft(approval.timeout_seconds);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [approval.approval_id, approval.timeout_seconds]);

  const entries = Object.entries(approval.arguments);

  return (
    <div className="flex justify-center my-2">
      <div className={`w-full max-w-xl rounded-2xl p-4 ${
        isDarkMode
          ? 'bg-amber-500/10 border border-amber-500/30 text-white'
          : 'bg-amber-50 border border-amber-300 text-gray-900 shadow-md'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-semibold">
            ✋ Approve this action?
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            {secondsLeft}s left
          </span>
        </div>

        <div className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The agent wants to run <span className="font-medium">{formatToolName(approval.tool)}</span> with:
        </div>

        {/* Why this needs approval, when it isn't an ordinary write (e.g. opening a new web address) */}
        {approval.reason && (
          <div className={`text-sm mb-3 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            {approval.reason}
          </div>
        )}

        {/* The request came after the agent read third-party content - it may be an injected instruction */}
        {approval.untrusted_sources?.length > 0 && (
          <div className={`text-sm mb-3 rounded-lg px-3 py-2 ${
            isDarkMode ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            ⚠️ The agent asked for this after reading content from others
            ({approval.untrusted_sources.map(formatToolName).join(', ')}).
            Check the recipient and content carefully - text in emails or web pages can try to trick the agent.
          </div>
        )}

        {/* Exact arguments - the user must see what will be sent before approving */}
        <dl className="space-y-2 mb-4">
          {entries.length === 0 && (
            <div className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No arguments</div>
          )}
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {key}
              </dt>
              <dd className={`text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto rounded-lg px-3 py-2 ${
                isDarkMode ? 'bg-white/[0.05]' : 'bg-white border border-amber-200'
              }`}>
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision('deny')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isDarkMode
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            Deny
          </button>
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision('approve')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
