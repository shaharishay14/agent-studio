export type IntegrationCategory = 'email' | 'storage' | 'communication' | 'productivity' | 'social' | 'developer';

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  isConnected: boolean;
  connectionId?: number;
}

export type FilterCategory = 'All' | 'Email' | 'Storage' | 'Communication' | 'Productivity' | 'Social' | 'Developer';

