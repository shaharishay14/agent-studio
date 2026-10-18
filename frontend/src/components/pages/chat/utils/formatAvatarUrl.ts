/**
 * פונקציה להמיר base64 לפורמט data URL אם צריך
 * @param avatar - מחרוזת base64 או null
 * @returns data URL מעוצב או null
 */
export const formatAvatarUrl = (avatar: string | null | undefined): string | null => {
  if (!avatar) return null;
  // אם כבר יש data:image prefix, החזר כמו שזה
  if (avatar.startsWith('data:image')) return avatar;
  // אחרת, הוסף את ה-prefix (נניח שזה PNG, אבל יכול להיות גם JPEG)
  return `data:image/png;base64,${avatar}`;
};

