import useDarkModeStore from '../../../../../store/darkmode.store'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <>
      <h1 className={`text-3xl font-bold text-center mb-2 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </h1>
      <p className={`text-sm text-center mb-6 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {subtitle}
      </p>
    </>
  )
}

