import { Monitor } from 'lucide-react'

export const AuthLogo = () => {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        {/* Blur background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl blur-2xl opacity-60 animate-pulse"></div>
        {/* Main icon */}
        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-purple-500/50">
          <Monitor className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      </div>
    </div>
  )
}

