export type AdminStats = {
  totalUsers: number
  authenticatedUsers: number
  anonymousUsers: number
  premiumUsers: number
  totalMessages: number
  messagesToday: number
  dailyActiveUsers: number
  totalChats: number
  chatsToday: number
  topModels: { model: string; count: number }[]
 recentUsers: {
    id: string
    email: string
    anonymous: boolean
    premium: boolean
    message_count: number
    daily_message_count: number
    created_at: string
    last_active_at: string
  }[]
}

export type AdminUser = {
  id: string
  email: string
  anonymous: boolean
  premium: boolean
  display_name: string | null
  profile_image: string | null
  message_count: number
  daily_message_count: number
  daily_pro_message_count: number
  favorite_models: string[] | null
  system_prompt: string | null
  created_at: string
  last_active_at: string
  daily_reset: string | null
  daily_pro_reset: string | null
}

export type SystemConfig = {
  hasOpenaiKey: boolean
  hasMistralKey: boolean
  hasGoogleKey: boolean
  hasAnthropicKey: boolean
  hasXaiKey: boolean
  hasOpenrouterKey: boolean
  hasPerplexityKey: boolean
  hasExaKey: boolean
  hasSupabase: boolean
  hasEncryptionKey: boolean
  hasCsrfSecret: boolean
  nodeEnv: string
  freeModelIds: string[]
  rateLimits: {
    nonAuthDaily: number
    authDaily: number
    dailyProModels: number
    dailyFileUpload: number
  }
}
