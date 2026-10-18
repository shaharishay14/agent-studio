import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface PasswordInputProps {
  id: string
  label: string
  placeholder: string
  register: UseFormRegisterReturn
  error?: string
  helperText?: string
  showForgotPassword?: boolean
}

export const PasswordInput = ({ 
  id, 
  label, 
  placeholder, 
  register, 
  error,
  helperText,
  showForgotPassword = false
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const { isDarkMode } = useDarkModeStore()

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className={`block text-sm font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-700'
        }`}>
          {label}
        </label>
        {showForgotPassword && (
          <Link 
            to="/auth/forgot-password" 
            className={`text-xs transition-colors ${
              isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            Forgot password?
          </Link>
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className={`w-5 h-5 ${
            isDarkMode ? 'text-gray-500 drop-shadow-md' : 'text-gray-400'
          }`} />
        </div>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          {...register}
          className={`w-full border rounded-lg py-3 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
            isDarkMode 
              ? 'bg-[#0f0f0f] border-gray-800 text-gray-300 placeholder-gray-600 focus:shadow-lg focus:shadow-purple-500/20' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:shadow-md'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
            isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {showPassword ? (
            <EyeOff className={`w-5 h-5 ${isDarkMode ? 'drop-shadow-md' : ''}`} />
          ) : (
            <Eye className={`w-5 h-5 ${isDarkMode ? 'drop-shadow-md' : ''}`} />
          )}
        </button>
      </div>
      {helperText && (
        <p className={`mt-1 text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {helperText}
        </p>
      )}
      {error && (
        <p className={`mt-1 text-xs ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>{error}</p>
      )}
    </div>
  )
}

