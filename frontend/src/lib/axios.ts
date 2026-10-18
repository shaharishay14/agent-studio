import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // שליחת cookies אוטומטית עם כל בקשה
})

// הוספת interceptor לטיפול בשגיאות
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // אם יש שגיאת אימות, ניקוי המשתמש מה-store
      // אפשר להוסיף כאן redirect ל-login
    }
    return Promise.reject(error)
  }
)

