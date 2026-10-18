import { useState, useEffect } from 'react';
import useModalsStore from '../../../../../store/modals.store';
import { useGetWorkflows } from './useGetWorkflows';

export const useActionsWorkflow = () => {
  const { openCreateWorkflowModal, openEditWorkflowModal, openDeleteWorkflowModal } = useModalsStore();
  const {
    workflows,
    isLoading,
    isError,
    error,
    refetch,
    selectedWorkflowId,
    setSelectedWorkflowId,
  } = useGetWorkflows();
  
  // בדוק אם אנחנו ב-mobile בהתחלה - ב-mobile ה-sidebar סגור כברירת מחדל
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return true; // fallback for SSR
  });

  // עדכן את המצב כשגודל המסך משתנה
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // ב-desktop, פתח את ה-sidebar כברירת מחדל
        setIsSidebarOpen(true);
      } else {
        // ב-mobile, סגור את ה-sidebar
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateWorkflow = () => {
    openCreateWorkflowModal();
  };

  const handleEditWorkflow = (id: number) => {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      openEditWorkflowModal(id, workflow.name, workflow.description);
    }
  };

  const handleDeleteWorkflow = (id: number) => {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      openDeleteWorkflowModal(id, workflow.name);
    }
  };

  const handleSelectWorkflow = (id: number) => {
    setSelectedWorkflowId(id);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return {
    // Data
    workflows,
    isLoading,
    isError,
    error,
    refetch,
    selectedWorkflowId,
    isSidebarOpen,
    setIsSidebarOpen,
    // Actions
    handleCreateWorkflow,
    handleEditWorkflow,
    handleDeleteWorkflow,
    handleSelectWorkflow,
    handleCloseSidebar,
  };
};

