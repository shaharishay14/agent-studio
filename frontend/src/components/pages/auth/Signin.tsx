import { LogIn, Sparkles } from 'lucide-react'
import { 
  AuthLogo, 
  AuthHeader, 
  AuthDivider, 
  SocialButtons, 
  AuthFooterLink,
  SigninForm,
  SubmitButton
} from './components'
import { useLogin, useProviders } from './hooks'
import useDarkModeStore from '../../../../store/darkmode.store'



function Signin() {
  const { register, handleSubmit, errors, onSubmit, isLoading } = useLogin()
  const { handleGoogleLogin, handleGithubLogin, isLoading: isProviderLoading } = useProviders()
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">

        <AuthLogo />
        
        <AuthHeader 
          title="Welcome back"
          subtitle="Sign in to continue building amazing AI agents"
        />

        {/* Continue creating your agent after signing in */}
        <div className={`mb-6 rounded-lg p-4 border-2 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 border-purple-700/50' 
            : 'bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border-purple-300 shadow-md'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-purple-800/50' : 'bg-purple-200'
            }`}>
              <Sparkles className={`w-5 h-5 ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              }`} />
            </div>
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-purple-200' : 'text-purple-800'
            }`}>
              Continue creating your agent after signing in
            </p>
          </div>
        </div>

        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <SigninForm register={register} errors={errors} />
              <SubmitButton
                isLoading={isLoading || isProviderLoading}
                loadingText="Signing in..."
                text="Sign in"
                icon={LogIn}
              />
            </form>

            <AuthDivider />

            <SocialButtons 
              onGoogleClick={handleGoogleLogin}
              onGithubClick={handleGithubLogin}
            />

          <AuthFooterLink
            text="Don't have an account?"
            linkText="Create account"
            linkTo="/auth/signup"
          />
        </div>
      </div>
    </div>
  )
}

export default Signin

