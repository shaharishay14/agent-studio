import { Link } from 'react-router-dom'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface AuthFooterLinkProps {
  text: string
  linkText: string
  linkTo: string
}

export const AuthFooterLink = ({ text, linkText, linkTo }: AuthFooterLinkProps) => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <p className={`text-center text-sm ${
      isDarkMode ? 'text-gray-400' : 'text-gray-600'
    }`}>
      {text}{' '}
      <Link 
        to={linkTo} 
        className={`font-medium transition-colors ${
          isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
        }`}
      >
        {linkText}
      </Link>
    </p>
  )
}

