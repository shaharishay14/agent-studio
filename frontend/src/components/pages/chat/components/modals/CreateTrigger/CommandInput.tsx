interface CommandInputProps {
  command: string;
  onCommandChange: (command: string) => void;
}

function CommandInput({ command, onCommandChange }: CommandInputProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Agent Command</h3>
            <p className="text-gray-400 text-sm">What should the agent do when triggered?</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          placeholder="Enter the command to send to the agent when this trigger fires...&#10;&#10;Example: Generate a daily report of all new users and summarize their activities."
          className="w-full h-40 bg-gray-800/50 border-2 border-gray-700 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:bg-gray-800/70 resize-none transition-all"
        />
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          {command.length} characters
        </div>
      </div>
      
      <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-300">
            <span className="font-semibold">Tip:</span> Be specific and clear with your instructions. The agent will execute this command exactly as written.
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandInput;

