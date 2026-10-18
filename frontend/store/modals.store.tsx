import { create } from 'zustand';

interface DeleteModalState {
  isOpen: boolean;
  agentId: string | null;
  agentName: string | null;
}

interface DeleteFileModalState {
  isOpen: boolean;
  fileId: string | number | null;
  fileName: string | null;
}

interface CreateTriggerModalState {
  isOpen: boolean;
  agentId: string | null;
  workflowId?: number | null;
}

interface CreateWorkflowModalState {
  isOpen: boolean;
  workflowId: number | null;
  workflowData: {
    name: string;
    description: string;
  } | null;
}

interface DeleteWorkflowModalState {
  isOpen: boolean;
  workflowId: number | null;
  workflowName: string | null;
}

interface AddAgentToWorkflowModalState {
  isOpen: boolean;
  workflowId: number | null;
}

interface RemoveAgentFromWorkflowModalState {
  isOpen: boolean;
  workflowId: number | null;
  agentId: string | null;
  agentName: string | null;
}

interface ShareAgentModalState {
  isOpen: boolean;
  agentId: string | null;
  agentName: string | null;
}

interface ResetMemoryModalState {
  isOpen: boolean;
  agentId: string | null;
}

interface IntegrationDetailsModalState {
  isOpen: boolean;
  integrationId: string | null;
  integrationName: string | null;
  integrationSlug: string | null;
}

interface TelegramBotModalState {
  isOpen: boolean;
  agentId: string | null;
}

interface ModalsStore {
  deleteModal: DeleteModalState;
  openDeleteModal: (agentId: string, agentName: string) => void;
  closeDeleteModal: () => void;
  
  deleteFileModal: DeleteFileModalState;
  openDeleteFileModal: (fileId: string | number, fileName: string) => void;
  closeDeleteFileModal: () => void;

  createTriggerModal: CreateTriggerModalState;
  openCreateTriggerModal: (agentId: string) => void;
  openCreateTriggerModalForWorkflow: (workflowId: number) => void;
  closeCreateTriggerModal: () => void;

  createWorkflowModal: CreateWorkflowModalState;
  openCreateWorkflowModal: () => void;
  openEditWorkflowModal: (workflowId: number, name: string, description: string) => void;
  closeCreateWorkflowModal: () => void;

  deleteWorkflowModal: DeleteWorkflowModalState;
  openDeleteWorkflowModal: (workflowId: number, workflowName: string) => void;
  closeDeleteWorkflowModal: () => void;

  addAgentToWorkflowModal: AddAgentToWorkflowModalState;
  openAddAgentToWorkflowModal: (workflowId: number) => void;
  closeAddAgentToWorkflowModal: () => void;

  removeAgentFromWorkflowModal: RemoveAgentFromWorkflowModalState;
  openRemoveAgentFromWorkflowModal: (workflowId: number, agentId: string, agentName: string) => void;
  closeRemoveAgentFromWorkflowModal: () => void;

  shareAgentModal: ShareAgentModalState;
  openShareAgentModal: (agentId: string, agentName: string) => void;
  closeShareAgentModal: () => void;

  resetMemoryModal: ResetMemoryModalState;
  openResetMemoryModal: (agentId: string) => void;
  closeResetMemoryModal: () => void;

  integrationDetailsModal: IntegrationDetailsModalState;
  openIntegrationDetailsModal: (integrationId: string, integrationName: string, integrationSlug: string) => void;
  closeIntegrationDetailsModal: () => void;

  telegramBotModal: TelegramBotModalState;
  openTelegramBotModal: (agentId: string) => void;
  closeTelegramBotModal: () => void;
}

const useModalsStore = create<ModalsStore>((set) => ({
  deleteModal: {
    isOpen: false,
    agentId: null,
    agentName: null,
  },
  openDeleteModal: (agentId: string, agentName: string) =>
    set({
      deleteModal: {
        isOpen: true,
        agentId,
        agentName,
      },
    }),
  closeDeleteModal: () =>
    set({
      deleteModal: {
        isOpen: false,
        agentId: null,
        agentName: null,
      },
    }),
  
  deleteFileModal: {
    isOpen: false,
    fileId: null,
    fileName: null,
  },
  openDeleteFileModal: (fileId: string | number, fileName: string) =>
    set({
      deleteFileModal: {
        isOpen: true,
        fileId,
        fileName,
      },
    }),
  closeDeleteFileModal: () =>
    set({
      deleteFileModal: {
        isOpen: false,
        fileId: null,
        fileName: null,
      },
    }),

  createTriggerModal: {
    isOpen: false,
    agentId: null,
    workflowId: null,
  },
  openCreateTriggerModal: (agentId: string) =>
    set({
      createTriggerModal: {
        isOpen: true,
        agentId,
        workflowId: null,
      },
    }),
  openCreateTriggerModalForWorkflow: (workflowId: number) =>
    set({
      createTriggerModal: {
        isOpen: true,
        agentId: null,
        workflowId,
      },
    }),
  closeCreateTriggerModal: () =>
    set({
      createTriggerModal: {
        isOpen: false,
        agentId: null,
        workflowId: null,
      },
    }),

  createWorkflowModal: {
    isOpen: false,
    workflowId: null,
    workflowData: null,
  },
  openCreateWorkflowModal: () =>
    set({
      createWorkflowModal: {
        isOpen: true,
        workflowId: null,
        workflowData: null,
      },
    }),
  openEditWorkflowModal: (workflowId: number, name: string, description: string) =>
    set({
      createWorkflowModal: {
        isOpen: true,
        workflowId,
        workflowData: { name, description },
      },
    }),
  closeCreateWorkflowModal: () =>
    set({
      createWorkflowModal: {
        isOpen: false,
        workflowId: null,
        workflowData: null,
      },
    }),

  deleteWorkflowModal: {
    isOpen: false,
    workflowId: null,
    workflowName: null,
  },
  openDeleteWorkflowModal: (workflowId: number, workflowName: string) =>
    set({
      deleteWorkflowModal: {
        isOpen: true,
        workflowId,
        workflowName,
      },
    }),
  closeDeleteWorkflowModal: () =>
    set({
      deleteWorkflowModal: {
        isOpen: false,
        workflowId: null,
        workflowName: null,
      },
    }),

  addAgentToWorkflowModal: {
    isOpen: false,
    workflowId: null,
  },
  openAddAgentToWorkflowModal: (workflowId: number) =>
    set({
      addAgentToWorkflowModal: {
        isOpen: true,
        workflowId,
      },
    }),
  closeAddAgentToWorkflowModal: () =>
    set({
      addAgentToWorkflowModal: {
        isOpen: false,
        workflowId: null,
      },
    }),

  removeAgentFromWorkflowModal: {
    isOpen: false,
    workflowId: null,
    agentId: null,
    agentName: null,
  },
  openRemoveAgentFromWorkflowModal: (workflowId: number, agentId: string, agentName: string) =>
    set({
      removeAgentFromWorkflowModal: {
        isOpen: true,
        workflowId,
        agentId,
        agentName,
      },
    }),
  closeRemoveAgentFromWorkflowModal: () =>
    set({
      removeAgentFromWorkflowModal: {
        isOpen: false,
        workflowId: null,
        agentId: null,
        agentName: null,
      },
    }),

  shareAgentModal: {
    isOpen: false,
    agentId: null,
    agentName: null,
  },
  openShareAgentModal: (agentId: string, agentName: string) =>
    set({
      shareAgentModal: {
        isOpen: true,
        agentId,
        agentName,
      },
    }),
  closeShareAgentModal: () =>
    set({
      shareAgentModal: {
        isOpen: false,
        agentId: null,
        agentName: null,
      },
    }),

  resetMemoryModal: {
    isOpen: false,
    agentId: null,
  },
  openResetMemoryModal: (agentId: string) =>
    set({
      resetMemoryModal: {
        isOpen: true,
        agentId,
      },
    }),
  closeResetMemoryModal: () =>
    set({
      resetMemoryModal: {
        isOpen: false,
        agentId: null,
      },
    }),

  integrationDetailsModal: {
    isOpen: false,
    integrationId: null,
    integrationName: null,
    integrationSlug: null,
  },
  openIntegrationDetailsModal: (integrationId: string, integrationName: string, integrationSlug: string) =>
    set({
      integrationDetailsModal: {
        isOpen: true,
        integrationId,
        integrationName,
        integrationSlug,
      },
    }),
  closeIntegrationDetailsModal: () =>
    set({
      integrationDetailsModal: {
        isOpen: false,
        integrationId: null,
        integrationName: null,
        integrationSlug: null,
      },
    }),

  telegramBotModal: {
    isOpen: false,
    agentId: null,
  },
  openTelegramBotModal: (agentId: string) =>
    set({
      telegramBotModal: {
        isOpen: true,
        agentId,
      },
    }),
  closeTelegramBotModal: () =>
    set({
      telegramBotModal: {
        isOpen: false,
        agentId: null,
      },
    }),
}));

export default useModalsStore;

