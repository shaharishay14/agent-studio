import { useGoogleLogin } from '@react-oauth/google'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useUserStore } from '../../../../../store/user.store'
import { googleAuth, githubAuth, type ProviderAuthResponse } from '../requests'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useProviders = () => {
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useUserStore((state) => state)

  // Google Auth Mutation
  const {
    mutateAsync: googleMutate,
    isPending: isGoogleLoading,
  } = useMutation<ProviderAuthResponse, AxiosError<ErrorResponse>, string>({
    mutationFn: googleAuth,
    onSuccess: (data) => {
      // שמירת המשתמש ב-store
      setUser(data.user)
      setIsAuthenticated(true)
      
      // ה-tokens נשמרים אוטומטית ב-cookies
      console.log('Google login successful:', data.user)
      
      // ניווט לדף הbuilder
      navigate('/builder')
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Google login failed'
      console.error('Google login error:', message)
      toast.error(message)
    },
  })

  // GitHub Auth Mutation
  const {
    mutateAsync: githubMutate,
    isPending: isGithubLoading,
  } = useMutation<ProviderAuthResponse, AxiosError<ErrorResponse>, string>({
    mutationFn: githubAuth,
    onSuccess: (data) => {
      // שמירת המשתמש ב-store
      setUser(data.user)
      setIsAuthenticated(true)
      
      // ה-tokens נשמרים אוטומטית ב-cookies
      console.log('GitHub login successful:', data.user)
      
      // ניווט לדף הbuilder
      navigate('/builder')
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'GitHub login failed'
      console.error('GitHub login error:', message)
      toast.error(message)
    },
  })

  // Google Login with auth-code flow
  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      console.log('Google auth code received:', codeResponse.code)
      // שליחת הקוד לשרת
      await googleMutate(codeResponse.code)
    },
    onError: (error) => {
      console.error('Google login error:', error)
    },
  })

  // GitHub Login - נפתח חלון חדש ל-OAuth
  const handleGithubLogin = () => {
    // GitHub OAuth flow - redirect to GitHub
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${import.meta.env.VITE_FRONT_URL}/auth/callback/github`
    const scope = 'user:email'
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    
    // פתיחת חלון חדש
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    
    const popup = window.open(
      githubAuthUrl,
      'GitHub Login',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // האזנה למסר מהחלון הקופץ
    window.addEventListener('message', async (event) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'github-auth' && event.data.code) {
        console.log('GitHub auth code received:', event.data.code)
        await githubMutate(event.data.code)
        popup?.close()
      }
    })
  }

  return {
    handleGoogleLogin,
    handleGithubLogin,
    isGoogleLoading,
    isGithubLoading,
    isLoading: isGoogleLoading || isGithubLoading,
  }
}

