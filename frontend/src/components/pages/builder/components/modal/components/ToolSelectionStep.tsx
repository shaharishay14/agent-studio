import { Check, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BrandIcon } from '@/components/ui/brand-icon';
import { PillInput } from '@/components/ui/pill-input';
import { Spinner } from '@/components/ui/spinner';
import { categoryLabel } from '../../../../integrations/utils/categoryLabel';

interface Tool {
  name: string;
  tool_name?: string;
  slug?: string;
  description: string;
  category: string;
}

interface ToolSelectionStepProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTools: Tool[];
  selectedTools: string[];
  toggleTool: (toolName: string) => void;
  isLoadingTools: boolean;
}

function ToolSelectionStep({ searchTerm, setSearchTerm, filteredTools, selectedTools, toggleTool, isLoadingTools }: ToolSelectionStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-white/72">Pick the apps this agent can use. You can change them later.</p>

      <PillInput
        icon={<Search />}
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search apps"
        aria-label="Search apps"
      />

      <p className="m-0 min-h-5 text-[13px] text-white/66" aria-live="polite">
        {selectedTools.length > 0 && `${selectedTools.length} ${selectedTools.length === 1 ? 'app' : 'apps'} selected`}
      </p>

      <div className="max-h-[min(340px,40dvh)] overflow-y-auto pr-1">
        {isLoadingTools ? (
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/66">
            <Spinner size={18} />
            Loading apps…
          </div>
        ) : filteredTools.length === 0 ? (
          <p className="m-0 py-10 text-center text-sm text-white/66">
            {searchTerm ? `No apps match “${searchTerm}”.` : 'No apps available yet.'}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredTools.map((tool) => {
              // Prefer the slug, then tool_name, then name
              const toolId = tool.slug || tool.tool_name || tool.name;
              const isSelected = selectedTools.includes(toolId);

              return (
                <button
                  key={toolId}
                  type="button"
                  onClick={() => toggleTool(toolId)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex items-start gap-3 rounded-inner border p-3 text-left transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    isSelected ? 'border-white/60 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                  )}
                >
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-pill border',
                      isSelected ? 'border-white bg-white text-on-white' : 'border-white/25 bg-white/8 text-white'
                    )}
                    aria-hidden="true"
                  >
                    <BrandIcon name={tool.name} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{tool.name}</span>
                      {isSelected && <Check className="size-4 shrink-0 text-white" strokeWidth={2} aria-hidden="true" />}
                    </span>
                    <span className="line-clamp-2 text-[13px] leading-[18px] text-white/60">{tool.description}</span>
                    {tool.category && <span className="mt-1 block text-xs text-white/50">{categoryLabel(tool.category)}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolSelectionStep;
