import { api } from '../../../../lib/axios'
import type { 
  SignupFormData, 
  SigninFormData, 
  ForgotPasswordFormData, 
  ResetPasswordFormData,
  VerifyEmailFormData 
} from '../types'

export interface User {
  id: string
  username: string
  email: string
  agent_country: string
}

export interface RegisterResponse {
  access: string
  refresh: string
  user: User
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface ForgotPasswordResponse {
  detail: string
}

export interface ResetPasswordResponse {
  detail: string
}

export interface VerifyEmailResponse {
  detail: string
}

export interface ProviderAuthResponse {
  access: string
  refresh: string
  user: User
}

export const registerUser = async (data: SignupFormData): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register/', data)
  return response.data
}

export const loginUser = async (data: SigninFormData): Promise<LoginResponse> => {
  console.log(data)
  const response = await api.post<LoginResponse>('/auth/login/', data)
  return response.data
}

export const forgotPassword = async (data: ForgotPasswordFormData): Promise<ForgotPasswordResponse> => {
  const response = await api.post<ForgotPasswordResponse>('/auth/password/forgot/', data)
  return response.data
}

export const resetPassword = async (data: ResetPasswordFormData): Promise<ResetPasswordResponse> => {
  const response = await api.post<ResetPasswordResponse>('/auth/password/reset/', data)
  return response.data
}

export const verifyEmail = async (data: VerifyEmailFormData): Promise<VerifyEmailResponse> => {
  const response = await api.post<VerifyEmailResponse>('/auth/email/verify/resend/', data)
  return response.data
}

export const googleAuth = async (code: string): Promise<ProviderAuthResponse> => {
  const response = await api.post<ProviderAuthResponse>('/auth/google/', { code })
  return response.data
}

export const githubAuth = async (code: string): Promise<ProviderAuthResponse> => {
  const response = await api.post<ProviderAuthResponse>('/auth/github/', { code })
  return response.data
}

export const fetchMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me/')
  return response.data
}

export interface LogoutResponse {
  detail: string
}

export const logoutUser = async (): Promise<LogoutResponse> => {
  const response = await api.post<LogoutResponse>('/auth/logout/')
  return response.data
}

export interface ResendVerificationResponse {
  detail: string
}

export const resendVerificationEmail = async (): Promise<ResendVerificationResponse> => {
  const response = await api.post<ResendVerificationResponse>('/auth/email/verify/resend/')
  return response.data
}

