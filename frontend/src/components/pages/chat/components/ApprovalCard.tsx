import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';

import { ApprovalCard as SkyApprovalCard } from '@/components/ui/approval-card';
import { BrandIcon } from '@/components/ui/brand-icon';
import { formatToolName, splitToolName } from '../utils';
import type { ToolApprovalRequest, ApprovalDecision } from '../types';

interface ApprovalCardProps {
  approval: ToolApprovalRequest;
  isDeciding: boolean;
  onDecision: (decision: ApprovalDecision) => void;
}

const formatValue = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Argument names that hold who it goes to, and what it says. They're promoted into the
// card's tool row and preview; every other argument is listed below them.
const RECIPIENT_KEYS = ['to', 'recipient_email', 'recipient', 'email', 'chat_id', 'phone_number'];
const BODY_KEYS = ['body', 'message', 'text', 'content'];

const pick = (args: Record<string, unknown>, keys: string[]) => keys.find((key) => typeof args[key] === 'string' && args[key]);

export const ApprovalCard = ({ approval, isDeciding, onDecision }: ApprovalCardProps) => {
  const [secondsLeft, setSecondsLeft] = useState(approval.timeout_seconds);

  useEffect(() => {
    setSecondsLeft(approval.timeout_seconds);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [approval.approval_id, approval.timeout_seconds]);

  const expired = secondsLeft === 0;
  const recipientKey = pick(approval.arguments, RECIPIENT_KEYS);
  const bodyKey = pick(approval.arguments, BODY_KEYS);
  const otherEntries = Object.entries(approval.arguments).filter(([key]) => key !== recipientKey && key !== bodyKey);
  const { app } = splitToolName(approval.tool);

  return (
    <SkyApprovalCard
      className="self-start"
      title={expired ? 'This request expired' : 'Waiting for your approval'}
      status={expired ? 'off' : 'busy'}
      badge={expired ? 'Expired' : `Expires in ${formatClock(secondsLeft)}`}
      toolIcon={<BrandIcon name={app} size={16} />}
      toolName={formatToolName(approval.tool)}
      toolDetail={recipientKey ? `To ${approval.arguments[recipientKey] as string}` : undefined}
      preview={bodyKey ? (approval.arguments[bodyKey] as string) : undefined}
      deciding={isDeciding || expired}
      onDeny={() => onDecision('deny')}
      onApprove={() => onDecision('approve')}
    >
      {/* Why this needs approval, when it isn't an ordinary write (e.g. opening a new web address) */}
      {approval.reason && <p className="m-0 text-sm leading-[21px] text-busy">{approval.reason}</p>}

      {/* Recipients the user never wrote - an email or page may have chosen where this goes */}
      {approval.suspicious_recipients?.length > 0 && (
        <div className="flex gap-2.5 rounded-2xl border border-off/40 bg-off/10 px-3.5 py-3 text-sm leading-[21px]" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-off" strokeWidth={1.7} aria-hidden="true" />
          <div>
            You didn't write {approval.suspicious_recipients.length === 1 ? 'this recipient' : 'these recipients'}:
            <ul className="my-1 list-disc ps-5">
              {approval.suspicious_recipients.map(({ value, source }) => (
                <li key={value}>
                  <span className="font-medium break-all">{value}</span> came from {formatToolName(source)}
                </li>
              ))}
            </ul>
            Text in emails or web pages can try to trick the agent into sending to the wrong place.
          </div>
        </div>
      )}

      {/* The request came after the agent read third-party content - it may be an injected instruction */}
      {approval.untrusted_sources?.length > 0 && (
        <div className="flex gap-2.5 rounded-2xl border border-off/40 bg-off/10 px-3.5 py-3 text-sm leading-[21px]" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-off" strokeWidth={1.7} aria-hidden="true" />
          <p className="m-0">
            The agent asked for this after reading content from others ({approval.untrusted_sources.map(formatToolName).join(', ')}).
            Check the recipient and content carefully: text in emails or web pages can try to trick the agent.
          </p>
        </div>
      )}

      {/* Exact arguments - the user must see what will be sent before approving */}
      {otherEntries.length > 0 && (
        <dl className="m-0 flex flex-col gap-2">
          {otherEntries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <dt className="text-xs tracking-[0.06em] text-white/60 uppercase">{key.replace(/_/g, ' ')}</dt>
              <dd className="m-0 max-h-40 overflow-y-auto rounded-xl bg-night/30 px-3 py-2 text-sm break-words whitespace-pre-wrap text-white/90">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {Object.keys(approval.arguments).length === 0 && <p className="m-0 text-sm text-white/60 italic">No details were sent with this request.</p>}
    </SkyApprovalCard>
  );
};
