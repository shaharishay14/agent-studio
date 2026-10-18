import type { UseFormRegisterReturn } from 'react-hook-form'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface AuthInputProps {
  id: string
  label: string
  type: string
  placeholder: string
  icon: React.ComponentType<{ className?: string }>
  register: UseFormRegisterReturn
  error?: string
  helperText?: string
}

export const AuthInput = ({ 
  id, 
  label, 
  type, 
  placeholder, 
  icon: Icon, 
  register, 
  error,
  helperText
}: AuthInputProps) => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${
        isDarkMode ? 'text-white' : 'text-gray-700'
      }`}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`w-5 h-5 ${
            isDarkMode ? 'text-gray-500 drop-shadow-md' : 'text-gray-400'
          }`} />
        </div>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...register}
          className={`w-full border rounded-lg py-3 pl-11 pr-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
            isDarkMode 
              ? 'bg-[#0f0f0f] border-gray-800 text-gray-300 placeholder-gray-600 focus:shadow-lg focus:shadow-purple-500/20' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:shadow-md'
          }`}
        />
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

    