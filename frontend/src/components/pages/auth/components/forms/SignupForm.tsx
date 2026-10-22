import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Mail, User } from 'lucide-react'
import { AuthInput, PasswordInput } from '../AuthFields'
import type { SignupFormData } from '../../types'

interface SignupFormProps {
  register: UseFormRegister<SignupFormData>
  errors: FieldErrors<SignupFormData>
}

export const SignupForm = ({ register, errors }: SignupFormProps) => {
  return (
    <div className="flex flex-col gap-[18px]">
      <AuthInput
        id="username"
        label="Username"
        placeholder="Choose a username"
        icon={<User />}
        autoComplete="username"
        register={register('username')}
        error={errors.username?.message}
      />

      <AuthInput
        id="email"
        label="Email"
        type="email"
        placeholder="name@company.com"
        icon={<Mail />}
        autoComplete="email"
        register={register('email')}
        error={errors.email?.message}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="Create a password"
        autoComplete="new-password"
        register={register('password')}
        error={errors.password?.message}
        helperText="At least 8 characters"
      />

      <PasswordInput
        id="password_confirm"
        label="Confirm password"
        placeholder="Type it again"
        autoComplete="new-password"
        register={register('password_confirm')}
        error={errors.password_confirm?.message}
      />
    </div>
  )
}
