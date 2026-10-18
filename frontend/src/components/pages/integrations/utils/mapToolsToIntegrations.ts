import type { AvailableTool } from '../types';
import type { Integration, IntegrationCategory } from '../components/types';

// מיפוי אייקונים לפי שם הכלי
const iconMap: Record<string, string> = {
  'Gmail': '✉️',
  'Google Drive': '💾',
  'Google Docs': '📄',
  'Google Sheets': '📊',
  'Google Calendar': '📅',
  'Google Meet': '📹',
  'Google Slides': '📊',
  'Slack': '#️⃣',
  'Twitter': '🐦',
  'X': '🐦',
  'LinkedIn': '💼',
  'Notion': '📝',
  'GitHub': '🐙',
  'Linear': '📋',
  'Reddit': '🔴',
  'Discord': '💬',
  'Telegram': '✈️',
  'WhatsApp': '📱',
  'Whatsapp': '📱',
  'Zoom': '📹',
  'Trello': '📌',
  'Asana': '✓',
  'Jira': '🎯',
  'Dropbox': '📦',
  'OneDrive': '☁️',
  'Figma': '🎨',
  'Stripe': '💳',
  'PayPal': '💰',
  'Shopify': '🛒',
  'Mailchimp': '📧',
  'HubSpot': '🚀',
  'Salesforce': '☁️',
  'Airtable': '📋',
  'Canva': '🎨',
  'Clickup': '✅',
  'ClickUp': '✅',
  'Facebook': '👥',
  'Instagram': '📷',
  'Monday': '📊',
  'Outlook': '📧',
  'Todoist': '☑️',
};

// מיפוי אייקונים לפי קטגוריה (fallback)
const categoryIconMap: Record<string, string> = {
  'communication': '💬',
  'productivity': '⚡',
  'messaging': '💬',
  'social': '🌐',
  'email': '✉️',
  'storage': '💾',
  'developer': '⚙️',
  'finance': '💰',
  'marketing': '📣',
  'design': '🎨',
  'video': '📹',
  'analytics': '📊',
};

// המרת קטגוריה מהשרת לקטגוריה מקומית
const mapCategory = (category: string): IntegrationCategory => {
  const categoryLower = category.toLowerCase();
  
  // מיפוי ישיר
  const directMapping: Record<string, IntegrationCategory> = {
    'communication': 'communication',
    'messaging': 'communication',
    'productivity': 'productivity',
    'social': 'social',
    'email': 'email',
    'storage': 'storage',
    'developer': 'developer',
  };
  
  return directMapping[categoryLower] || 'productivity';
};

// פונקציה להמרת כלי אחד לאינטגרציה
const mapToolToIntegration = (tool: AvailableTool): Integration => {
  const icon = iconMap[tool.name] || categoryIconMap[tool.category.toLowerCase()] || '🔧';
  const id = tool.name.toLowerCase().replace(/\s+/g, '-');
  
  return {
    id,
    name: tool.name,
    slug: tool.tool_name || '',
    description: tool.description,
    category: mapCategory(tool.category),
    icon,
    isConnected: tool.is_active ?? false,
    connectionId: tool.connection_id,
  };
};

// פונקציה להמרת מערך כלים למערך אינטגרציות
export const mapToolsToIntegrations = (tools: AvailableTool[]): Integration[] => {
  return tools.map(mapToolToIntegration);
};

