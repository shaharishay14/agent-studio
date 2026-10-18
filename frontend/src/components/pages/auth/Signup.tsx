import { Zap } from 'lucide-react'
import { 
  AuthLogo, 
  AuthHeader, 
  AuthDivider, 
  SocialButtons, 
  AuthFooterLink,
  SignupForm,
  SubmitButton
} from './components'
import { useRegister, useProviders } from './hooks'
import useDarkModeStore from '../../../../store/darkmode.store'


function Signup() {
  const { register, handleSubmit, errors, onSubmit, isLoading } = useRegister()
  const { handleGoogleLogin, handleGithubLogin, isLoading: isProviderLoading } = useProviders()
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">
        <AuthLogo />
        
        <AuthHeader 
          title="Create your account"
          subtitle="Join thousands of users building amazing AI agents"
        />

        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <SignupForm register={register} errors={errors} />
              <SubmitButton
                isLoading={isLoading || isProviderLoading}
                loadingText="Creating account..."
                text="Create account"
                icon={Zap}
              />
            </form>

            <AuthDivider />

            <SocialButtons 
              onGoogleClick={handleGoogleLogin}
              onGithubClick={handleGithubLogin}
            />

          <AuthFooterLink
            text="Already have an account?"
            linkText="Sign in"
            linkTo="/auth/signin"
          />
        </div>
      </div>
    </div>
  )
}

export default Signup

