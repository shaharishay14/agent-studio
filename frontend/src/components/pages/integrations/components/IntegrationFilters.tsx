import type { FilterCategory } from './types';
import useDarkModeStore from '../../../../../store/darkmode.store';

interface IntegrationFiltersProps {
  selectedFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalIntegrations: number;
}

function IntegrationFilters({ 
  selectedFilter, 
  onFilterChange, 
  searchQuery, 
  onSearchChange,
  totalIntegrations 
}: IntegrationFiltersProps) {
  const { isDarkMode } = useDarkModeStore();
  const filters: FilterCategory[] = [
    'All', 
    'Email', 
    'Storage', 
    'Communication', 
    'Productivity', 
    'Social', 
    'Developer'
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex-none w-64">
        <input
          type="text"
          placeholder={`Search ${totalIntegrations} integrations`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full px-4 py-2 rounded-xl text-sm focus:outline-none transition-all duration-300 ${
            isDarkMode
              ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:bg-white/[0.08] focus:border-purple-500/50'
              : 'bg-white border border-purple-300 text-gray-900 placeholder:text-gray-500 focus:bg-white/90 focus:border-purple-500 shadow-sm'
          }`}
        />
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                isActive
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40'
                  : isDarkMode
                    ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/[0.08] hover:text-white'
                    : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100/70 hover:text-purple-900 hover:border-purple-400'
              }`}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default IntegrationFilters;

