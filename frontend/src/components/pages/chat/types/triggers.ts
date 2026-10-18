export type TriggerType = 'cron' | 'app_event' | null;
export type OutputType = 'email' | 'whatsapp' | null;
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type AppEventType = 'new_email' | 'new_commit' | 'new_message' | 'new_event' | null;

export interface AppEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

export interface CreateTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
}

export interface TriggerConfig {
  agentId?: string;
  triggerType: TriggerType;
  frequency: Frequency;
  hour: string;
  minute: string;
  command: string;
  outputType: OutputType;
  email: string;
  whatsappPhone: string;
  selectedAppEvent: AppEventType;
  eventConfig: EventConfig;
}

export interface EventConfig {
  interval: string;
  labelIds: string;
  query: string;
  userId: string;
}

export interface Step {
  num: number;
  title: string;
  subtitle: string;
}

