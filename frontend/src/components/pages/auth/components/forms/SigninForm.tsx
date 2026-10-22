import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { AtSign } from 'lucide-react'
import { AuthInput, PasswordInput } from '../AuthFields'
import type { SigninFormData } from '../../types'

interface SigninFormProps {
  register: UseFormRegister<SigninFormData>
  errors: FieldErrors<SigninFormData>
}

export const SigninForm = ({ register, errors }: SigninFormProps) => {
  return (
    <div className="flex flex-col gap-[18px]">
      <AuthInput
        id="username"
        label="Username or email"
        placeholder="name@company.com"
        icon={<AtSign />}
        autoComplete="username"
        register={register('username')}
        error={errors.username?.message}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="Your password"
        register={register('password')}
        error={errors.password?.message}
        showForgotPassword={true}
      />
    </div>
  )
}
