import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/axios';
import { useUserStore } from '../../../../../store/user.store';

const REFRESH_INTERVAL = 1000 * 60 * 14; // 14 דקות (לפני שה-token פג)

const refreshToken = async (): Promise<void> => {
  await api.post('/auth/token/refresh-cookie/');
};

export const useRefreshToken = () => {
  const { isAuthenticated } = useUserStore();

  return useQuery<void, Error>({
    queryKey: ['refresh-token'],
    queryFn: refreshToken,
    refetchInterval: REFRESH_INTERVAL, // רענון אוטומטי כל 14 דקות
    refetchOnWindowFocus: false, // לא לרענן בכל פוקוס על החלון
    retry: 1, // ניסיון חוזר אחד במקרה של כשלון
    enabled: isAuthenticated, // שלח בקשה רק אם המשתמש מאומת
  });


};

