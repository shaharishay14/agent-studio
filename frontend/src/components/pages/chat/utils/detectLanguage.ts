/**
 * Detects if the given text contains Hebrew characters
 * @param text - The text to check
 * @returns true if Hebrew characters are detected, false otherwise
 */
export const isHebrewText = (text: string): boolean => {
  if (!text?.trim()) return false;
  // Hebrew Unicode range: \u0590-\u05FF
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

