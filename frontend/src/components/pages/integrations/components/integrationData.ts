import type { Integration } from './types';

export const integrations: Integration[] = [
  { id: 'gmail', slug: 'gmail', name: 'Gmail', description: 'Access your Gmail account', category: 'email', icon: '✉️', isConnected: false },
  { id: 'google-docs', slug: 'google-docs', name: 'Google Docs', description: 'Read and update docs', category: 'productivity', icon: '📄', isConnected: false },
  { id: 'google-drive', slug: 'google-drive', name: 'Google Drive', description: 'Access and manage your Drive files', category: 'storage', icon: '💾', isConnected: false },
  { id: 'google-sheets', slug: 'google-sheets', name: 'Google Sheets', description: 'Read and update sheets', category: 'productivity', icon: '📊', isConnected: false },
  { id: 'linear', slug: 'linear', name: 'Linear', description: 'Manage issues and projects in Linear', category: 'productivity', icon: '📋', isConnected: false },
  { id: 'linkedin', slug: 'linkedin', name: 'LinkedIn', description: 'Post updates and access your profile and feed', category: 'social', icon: '💼', isConnected: false },
  { id: 'notion', slug: 'notion', name: 'Notion', description: 'Read and update Notion pages and databases', category: 'productivity', icon: '📝', isConnected: false },
  { id: 'reddit', slug: 'reddit', name: 'Reddit', description: 'Browse, post, and interact with Reddit communities', category: 'social', icon: '🔴', isConnected: false },
  { id: 'slack', slug: 'slack', name: 'Slack', description: 'Send messages and manage channels', category: 'communication', icon: '#️⃣', isConnected: false },
  { id: 'twitter', slug: 'twitter', name: 'X (Twitter)', description: 'Connect your X account', category: 'social', icon: '🐦', isConnected: false },
  { id: 'github', slug: 'github', name: 'GitHub', description: 'Work with repos, issues and pull requests', category: 'developer', icon: '🐙', isConnected: false },
  { id: 'google-calendar', slug: 'google-calendar', name: 'Google Calendar', description: 'Manage your calendar', category: 'productivity', icon: '📅', isConnected: false },
];

