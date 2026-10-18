import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { User } from 'lucide-react'
import { AuthInput } from '../AuthInput'
import { PasswordInput } from '../PasswordInput'
import type { SigninFormData } from '../../types'

interface SigninFormProps {
  register: UseFormRegister<SigninFormData>
  errors: FieldErrors<SigninFormData>
}

export const SigninForm = ({ register, errors }: SigninFormProps) => {
  return (
    <div className="space-y-4">
      <AuthInput
        id="username"
        label="Username or Email"
        type="text"
        placeholder="Enter your username or email"
        icon={User}
        register={register('username')}
        error={errors.username?.message}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="Enter your password"
        register={register('password')}
        error={errors.password?.message}
        showForgotPassword={true}
      />
    </div>
  )
}

