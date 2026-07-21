"use client"

import { fetchClient } from "@/lib/fetch"
import type { SystemConfig } from "@/lib/admin/types"
import {
  CheckCircleIcon,
  CloudSlashIcon,
  KeyIcon,
  LockIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"

type ConfigStatus = SystemConfig & { loaded: boolean; hasAdminPassword?: boolean; ollamaBaseUrl?: string }

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetchClient("/api/admin/config")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setConfig({ ...data, loaded: true })
      } catch {
        setConfig({ loaded: false } as ConfigStatus)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (!config?.loaded) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold tracking-tight">System Config</h1>
        <div className="mt-6 border-red-500/30 bg-red-500/5 rounded-lg border p-4">
          <p className="text-sm text-red-500 font-medium">Failed to load config</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Make sure you are authenticated as admin.
          </p>
        </div>
      </div>
    )
  }

  const apiKeys = [
    { label: "OpenAI", key: config.hasOpenaiKey, env: "OPENAI_API_KEY" },
    { label: "Anthropic (Claude)", key: config.hasAnthropicKey, env: "ANTHROPIC_API_KEY" },
    { label: "Google (Gemini)", key: config.hasGoogleKey, env: "GOOGLE_GENERATIVE_AI_API_KEY" },
    { label: "Mistral", key: config.hasMistralKey, env: "MISTRAL_API_KEY" },
    { label: "XAI (Grok)", key: config.hasXaiKey, env: "XAI_API_KEY" },
    { label: "OpenRouter", key: config.hasOpenrouterKey, env: "OPENROUTER_API_KEY" },
    { label: "Perplexity", key: config.hasPerplexityKey, env: "PERPLEXITY_API_KEY" },
    { label: "Exa (Web Search)", key: config.hasExaKey, env: "EXA_API_KEY" },
  ]

  const systemKeys = [
    { label: "Supabase", key: config.hasSupabase, env: "NEXT_PUBLIC_SUPABASE_URL", critical: true },
    { label: "Encryption Key", key: config.hasEncryptionKey, env: "ENCRYPTION_KEY", critical: true },
    { label: "CSRF Secret", key: config.hasCsrfSecret, env: "CSRF_SECRET", critical: true },
    { label: "Admin Password", key: config.hasAdminPassword, env: "ADMIN_PASSWORD", critical: false },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Config</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Environment: <span className="font-mono bg-accent rounded px-1.5 py-0.5 text-xs">{config.nodeEnv}</span>
          &middot; Ollama: <span className="font-mono bg-accent rounded px-1.5 py-0.5 text-xs">{config.ollamaBaseUrl || "not set"}</span>
        </p>
      </div>

      {/* API Keys Status */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">API Keys Status</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {apiKeys.map((item) => (
            <div
              key={item.env}
              className="flex items-center justify-between rounded-lg p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.key ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CloudSlashIcon className="h-4 w-4 text-muted-foreground/50" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground font-mono text-xs">{item.env}</p>
                </div>
              </div>
              <span
                className={`text-xs font-medium ${
                  item.key ? "text-green-600" : "text-muted-foreground/50"
                }`}
              >
                {item.key ? "Active" : "Not Set"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Configuration */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <LockIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">System Configuration</h3>
        </div>
        <div className="space-y-2">
          {systemKeys.map((item) => (
            <div
              key={item.env}
              className="flex items-center justify-between rounded-lg p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.key ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : item.critical ? (
                  <WarningIcon className="h-4 w-4 text-red-500" />
                ) : (
                  <CloudSlashIcon className="h-4 w-4 text-muted-foreground/50" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {item.label}
                    {item.critical && !item.key && (
                      <span className="text-red-500 ml-2 text-xs">REQUIRED</span>
                    )}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">{item.env}</p>
                </div>
              </div>
              <span
                className={`text-xs font-medium ${
                  item.key
                    ? "text-green-600"
                    : item.critical
                      ? "text-red-500"
                      : "text-muted-foreground/50"
                }`}
              >
                {item.key ? "Configured" : "Missing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <WarningIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Rate Limits</h3>
          <span className="text-muted-foreground text-xs">
            (defined in lib/config.ts)
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">Guest Daily Limit</p>
            <p className="text-2xl font-bold">{config.rateLimits.nonAuthDaily}</p>
            <p className="text-muted-foreground text-xs">messages/day</p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">Auth Daily Limit</p>
            <p className="text-2xl font-bold">{config.rateLimits.authDaily}</p>
            <p className="text-muted-foreground text-xs">messages/day</p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">Pro Model Daily</p>
            <p className="text-2xl font-bold">{config.rateLimits.dailyProModels}</p>
            <p className="text-muted-foreground text-xs">messages/day</p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">File Upload Daily</p>
            <p className="text-2xl font-bold">{config.rateLimits.dailyFileUpload}</p>
            <p className="text-muted-foreground text-xs">files/day</p>
          </div>
        </div>
      </div>

      {/* Free Models */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <h3 className="font-semibold">Free Models</h3>
          <span className="text-muted-foreground text-xs">
            (accessible without API keys)
          </span>
        </div>
        <div className="space-y-1">
          {config.freeModelIds.map((id) => (
            <div key={id} className="flex items-center gap-2 text-sm">
              <span className="text-green-500 text-xs">&#9679;</span>
              <span className="font-mono text-xs">{id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}