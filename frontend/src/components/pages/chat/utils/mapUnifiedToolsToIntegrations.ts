import type { UnifiedTool } from '../types';
import type { Integration, IntegrationCategory } from '../../integrations/components/types';

// מיפוי אייקונים לפי שם הכלי
const iconMap: Record<string, string> = {
  'Gmail': '✉️',
  'Google Drive': '💾',
  'Google Docs': '📄',
  'Google Sheets': '📊',
  'Google Calendar': '📅',
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

/**
 * פונקציה להמרת UnifiedTool ל-Integration
 * משתמשת במיפוי אייקונים ממפת האייקונים הקבועה
 */
const mapUnifiedToolToIntegration = (tool: UnifiedTool): Integration => {
  // בחירת אייקון: תחילה לפי שם, אחר כך לפי קטגוריה, ולבסוף ברירת מחדל
  const icon = iconMap[tool.name] || 
               categoryIconMap[tool.category.toLowerCase()] || 
               tool.icon || 
               '🔧';
  
  // שימוש ב-tool_name כ-id כדי שיתאים למה שאנחנו שולחים בפונקציות
  const id = tool.tool_name;
  
  return {
    id,
    name: tool.name,
    slug: tool.tool_name,
    description: tool.description,
    category: mapCategory(tool.category),
    icon,
    isConnected: tool.is_connected_to_account,
    connectionId: tool.connection_id || undefined,
  };
};

/**
 * פונקציה להמרת מערך UnifiedTools למערך Integrations
 * @param tools - מערך של UnifiedTool
 * @returns מערך של Integration
 */
export const mapUnifiedToolsToIntegrations = (tools: UnifiedTool[]): Integration[] => {
  return tools.map(mapUnifiedToolToIntegration);
};

