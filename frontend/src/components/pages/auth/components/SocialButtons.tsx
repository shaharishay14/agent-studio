import { Button } from '@/components/ui/button'
import { BrandIcon } from '@/components/ui/brand-icon'

interface SocialButtonsProps {
  onGoogleClick: () => void
  onGithubClick: () => void
  disabled?: boolean
}

// Google and GitHub as glass pills, side by side
export const SocialButtons = ({ onGoogleClick, onGithubClick, disabled = false }: SocialButtonsProps) => {
  return (
    <div className="flex gap-2.5">
      <Button variant="glass" className="flex-1" onClick={onGoogleClick} disabled={disabled}>
        <BrandIcon name="Google" size={16} />
        Google
      </Button>
      <Button variant="glass" className="flex-1" onClick={onGithubClick} disabled={disabled}>
        <BrandIcon name="GitHub" size={16} />
        GitHub
      </Button>
    </div>
  )
}
