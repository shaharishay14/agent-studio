import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Mail, User } from 'lucide-react'
import { AuthInput } from '../AuthInput'
import { PasswordInput } from '../PasswordInput'
import type { SignupFormData } from '../../types'

interface SignupFormProps {
  register: UseFormRegister<SignupFormData>
  errors: FieldErrors<SignupFormData>
}

export const SignupForm = ({ register, errors }: SignupFormProps) => {
  return (
    <div className="space-y-4">
      <AuthInput
        id="username"
        label="Username"
        type="text"
        placeholder="Choose a username"
        icon={User}
        register={register('username')}
        error={errors.username?.message}
      />

      <AuthInput
        id="email"
        label="Email address"
        type="email"
        placeholder="Enter your email"
        icon={Mail}
        register={register('email')}
        error={errors.email?.message}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="Create a password"
        register={register('password')}
        error={errors.password?.message}
        helperText="Must be at least 8 characters long"
      />

      <PasswordInput
        id="password_confirm"
        label="Confirm password"
        placeholder="Confirm your password"
        register={register('password_confirm')}
        error={errors.password_confirm?.message}
      />
    </div>
  )
}

