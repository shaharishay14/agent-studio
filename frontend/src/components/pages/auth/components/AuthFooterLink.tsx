import { Link } from 'react-router-dom'

import { authLinkClass } from './authLinkClass'

interface AuthFooterLinkProps {
  text: string
  linkText: string
  linkTo: string
}

export const AuthFooterLink = ({ text, linkText, linkTo }: AuthFooterLinkProps) => {
  return (
    <p className="m-0 text-center text-sm text-white/72">
      {text}{' '}
      <Link to={linkTo} className={`${authLinkClass} text-sm`}>
        {linkText}
      </Link>
    </p>
  )
}
