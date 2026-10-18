import useDarkModeStore from '../../../../../store/darkmode.store'

export const AuthDivider = () => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className="relative flex items-center my-6">
      <div className={`flex-grow border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-300'
      }`}></div>
      <span className={`flex-shrink mx-3 text-xs ${
        isDarkMode ? 'text-gray-500' : 'text-gray-500'
      }`}>
        Or continue with
      </span>
      <div className={`flex-grow border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-300'
      }`}></div>
    </div>
  )
}

