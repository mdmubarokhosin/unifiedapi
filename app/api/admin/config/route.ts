import { verifyAdminSession } from "@/lib/admin/auth"
import {
  FREE_MODELS_IDS,
  NON_AUTH_DAILY_MESSAGE_LIMIT,
  AUTH_DAILY_MESSAGE_LIMIT,
  DAILY_LIMIT_PRO_MODELS,
  DAILY_FILE_UPLOAD_LIMIT,
} from "@/lib/config"
import { NextResponse } from "next/server"

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const env = process.env

    const config = {
      hasOpenaiKey: Boolean(env.OPENAI_API_KEY),
      hasMistralKey: Boolean(env.MISTRAL_API_KEY),
      hasGoogleKey: Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY),
      hasAnthropicKey: Boolean(env.ANTHROPIC_API_KEY),
      hasXaiKey: Boolean(env.XAI_API_KEY),
      hasOpenrouterKey: Boolean(env.OPENROUTER_API_KEY),
      hasPerplexityKey: Boolean(env.PERPLEXITY_API_KEY),
      hasExaKey: Boolean(env.EXA_API_KEY),
      hasSupabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
      hasEncryptionKey: Boolean(env.ENCRYPTION_KEY),
      hasCsrfSecret: Boolean(env.CSRF_SECRET),
      hasAdminPassword: Boolean(env.ADMIN_PASSWORD),
      nodeEnv: env.NODE_ENV || "development",
      ollamaBaseUrl: env.OLLAMA_BASE_URL || "not set",
      freeModelIds: FREE_MODELS_IDS,
      rateLimits: {
        nonAuthDaily: NON_AUTH_DAILY_MESSAGE_LIMIT,
        authDaily: AUTH_DAILY_MESSAGE_LIMIT,
        dailyProModels: DAILY_LIMIT_PRO_MODELS,
        dailyFileUpload: DAILY_FILE_UPLOAD_LIMIT,
      },
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Admin config error:", error)
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    )
  }
}