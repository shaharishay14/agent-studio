import { api } from '../../../../lib/axios';
import type { Agent, CreateManualAgentPayload } from '../types';

export const getAgents = async (): Promise<Agent[]> => {
  const response = await api.get<Agent[]>('/agents/');
  return response.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await api.delete(`/agents/${id}/`);
};

// פונקציה ליצירת תמונת avatar ברירת מחדל
const createDefaultAvatar = async (name: string): Promise<File> => {
  // יצירת canvas עם האות הראשונה של השם
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // רקע סגול
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(0, 0, 200, 200);
    
    // טקסט לבן עם האות הראשונה
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 100, 100);
  }
  
  // המרה ל-Blob ואז ל-File
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'avatar.png', { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png');
  });
};

export const createManualAgent = async (payload: CreateManualAgentPayload): Promise<Agent> => {
  const formData = new FormData();
  
  // Required fields
  formData.append('name', payload.name);
  formData.append('prompt', payload.prompt);
  
  // Avatar file - אם אין, ניצור ברירת מחדל
  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  } else {
    // יצירת avatar ברירת מחדל עם האות הראשונה של השם
    const defaultAvatar = await createDefaultAvatar(payload.name);
    formData.append('avatar', defaultAvatar);
  }
  
  // Optional app_connections (as JSON string)
  if (payload.app_connections && payload.app_connections.length > 0) {
    formData.append('app_connections', JSON.stringify(payload.app_connections));
  }
  
  // Optional agent_tools (as JSON string)
  if (payload.agent_tools && payload.agent_tools.length > 0) {
    formData.append('agent_tools', JSON.stringify(payload.agent_tools));
  }
  
  // Optional files
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }
  
  const response = await api.post<Agent>('/agents/create-manual/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

