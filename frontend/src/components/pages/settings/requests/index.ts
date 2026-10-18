import { api } from '../../../../lib/axios'

export interface CreditsBalance {
  total_credits: number
  credits_used: number
  credit_refresh_date: string
  next_refresh_date: string
}

export const getCreditsBalance = async (): Promise<CreditsBalance> => {
  const response = await api.get<CreditsBalance>('/credits/balance/')
  return response.data
}

