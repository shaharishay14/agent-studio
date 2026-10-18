import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkflows } from '../requests';
import type { Workflow } from '../types';

export const useGetWorkflows = () => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  
  const {
    data: workflows = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess,
  } = useQuery<Workflow[], Error>({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    workflows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess,
    selectedWorkflowId,
    setSelectedWorkflowId,
  };
};

