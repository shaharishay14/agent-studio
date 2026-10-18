/**
 * מחזיר מחלקות CSS להילה (glow effect) בצבע המתאים לפי iconBgColor
 */
export const getGlowClass = (iconBgColor: string): string => {
  if (iconBgColor.includes('purple')) {
    return 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:border-purple-500/40';
  } else if (iconBgColor.includes('blue')) {
    return 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-500/40';
  } else if (iconBgColor.includes('green')) {
    return 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:border-green-500/40';
  } else if (iconBgColor.includes('red')) {
    return 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:border-red-500/40';
  }
  return '';
};

