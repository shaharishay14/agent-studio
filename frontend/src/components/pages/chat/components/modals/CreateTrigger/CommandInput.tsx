import { TextArea } from '@/components/ui/text-area';
import StepHeading from './StepHeading';

interface CommandInputProps {
  command: string;
  onCommandChange: (command: string) => void;
}

function CommandInput({ command, onCommandChange }: CommandInputProps) {
  return (
    <div>
      <StepHeading title="What should the agent do?" subtitle="This message is sent to the agent each time the trigger fires." />
      <TextArea
        aria-label="Message to the agent"
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        placeholder="e.g. Summarize yesterday's new sign-ups and list anything unusual."
        rows={6}
        helper={`Be specific; the agent follows it as written. ${command.length} characters.`}
        autoFocus
      />
    </div>
  );
}

export default CommandInput;
