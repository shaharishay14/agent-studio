type SigninFormData = {
  username: string
  password: string
}

type SignupFormData = {
  username: string
  email: string
  password: string
  password_confirm: string
}

type ForgotPasswordFormData = {
  email: string
}

type ResetPasswordFormData = {
  password: string
  password_confirm: string
  uid: string
  token: string
}

type VerifyEmailFormData = {
  key: string
}

export type { 
  SigninFormData, 
  SignupFormData, 
  ForgotPasswordFormData, 
  ResetPasswordFormData,
  VerifyEmailFormData 
}