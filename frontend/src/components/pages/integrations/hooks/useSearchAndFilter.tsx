import { useState, useMemo } from 'react';
import type { Integration, FilterCategory } from '../components/types';

interface UseSearchAndFilterReturn {
  selectedFilter: FilterCategory;
  setSelectedFilter: (filter: FilterCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredIntegrations: Integration[];
}

export const useSearchAndFilter = (
  integrations: Integration[]
): UseSearchAndFilterReturn => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesFilter = 
        selectedFilter === 'All' || 
        integration.category.toLowerCase() === selectedFilter.toLowerCase();
      
      const matchesSearch = 
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [integrations, selectedFilter, searchQuery]);

  return {
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    filteredIntegrations,
  };
};

