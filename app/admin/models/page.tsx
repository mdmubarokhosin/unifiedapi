"use client"

import { fetchClient } from "@/lib/fetch"
import { FREE_MODELS_IDS, MODEL_DEFAULT } from "@/lib/config"
import {
  CheckCircleIcon,
  LightningIcon,
  RobotIcon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"

type ModelInfo = {
  id: string
  name: string
  provider: string
  providerId: string
  description?: string
  tags?: string[]
  contextWindow?: number
  inputCost?: number
  outputCost?: number
  speed?: string
  intelligence?: string
  reasoning?: boolean
  vision?: boolean
  accessible?: boolean
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-500/10 text-green-600",
  anthropic: "bg-orange-500/10 text-orange-600",
  google: "bg-blue-500/10 text-blue-600",
  mistral: "bg-purple-500/10 text-purple-600",
  openrouter: "bg-cyan-500/10 text-cyan-600",
  xai: "bg-red-500/10 text-red-600",
  perplexity: "bg-teal-500/10 text-teal-600",
  ollama: "bg-gray-500/10 text-gray-600",
  deepseek: "bg-indigo-500/10 text-indigo-600",
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetchClient("/api/models")
        const data = await res.json()
        if (data.models) {
          setModels(data.models)
        }
      } catch {
        // Use empty array on failure
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [])

  const filteredModels = models.filter((m) => {
    if (filter === "free" && !FREE_MODELS_IDS.includes(m.id)) return false
    if (filter === "paid" && FREE_MODELS_IDS.includes(m.id)) return false
    if (filter === "reasoning" && !m.reasoning) return false
    if (filter === "vision" && !m.vision) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  const grouped = filteredModels.reduce(
    (acc, m) => {
      const key = m.provider
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {} as Record<string, ModelInfo[]>
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Models</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {models.length} models configured &middot; {FREE_MODELS_IDS.length} free
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "free", label: "Free" },
            { key: "paid", label: "Paid" },
            { key: "reasoning", label: "Reasoning" },
            { key: "vision", label: "Vision" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring block h-9 max-w-xs w-full rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
        />
      </div>

      {/* Default Model Info */}
      <div className="bg-accent/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm">
          <RobotIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Default Model:</span>
          <span className="font-mono text-xs bg-accent rounded px-2 py-0.5">{MODEL_DEFAULT}</span>
        </div>
      </div>

      {/* Models by Provider */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <div key={provider}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm">{provider}</h3>
              <span className="text-muted-foreground text-xs">
                ({providerModels.length})
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {providerModels.map((model) => {
                const isFree = FREE_MODELS_IDS.includes(model.id)
                const isDefault = model.id === MODEL_DEFAULT
                const colorClass = PROVIDER_COLORS[model.provider] || "bg-accent text-muted-foreground"

                return (
                  <div
                    key={model.id}
                    className={`border-border bg-card rounded-xl border p-4 space-y-3 ${
                      isDefault ? "ring-primary/30 ring-1" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {model.name}
                          </p>
                          {isDefault && (
                            <span className="bg-primary/10 text-primary shrink-0 rounded px-1.5 py-0.5 text-xs">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-muted-foreground mt-0.5 truncate text-xs">
                          {model.id}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {isFree && (
                          <span className="bg-green-500/10 text-green-600 rounded px-1.5 py-0.5 text-xs font-medium">
                            FREE
                          </span>
                        )}
                        {model.reasoning && (
                          <span className={`${colorClass} rounded px-1.5 py-0.5 text-xs font-medium`}>
                            <LightningIcon className="inline h-3 w-3" /> R
                          </span>
                        )}
                        {model.vision && (
                          <span className="bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5 text-xs font-medium">
                            V
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {model.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex gap-3">
                        {model.contextWindow && (
                          <span>CTX: {(model.contextWindow / 1000).toFixed(0)}K</span>
                        )}
                        <span>{model.speed}</span>
                        <span>{model.intelligence}</span>
                      </div>
                      <div>
                        {model.inputCost !== undefined && model.outputCost !== undefined && (
                          <span className="font-mono">
                            ${model.inputCost}/${model.outputCost}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {model.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-accent text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Free Models List */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h3 className="mb-3 font-semibold text-sm">Free Model IDs</h3>
        <p className="text-muted-foreground mb-3 text-xs">
          These models are accessible without API keys. Edit lib/config.ts FREE_MODELS_IDS to change.
        </p>
        <div className="space-y-1">
          {FREE_MODELS_IDS.map((id) => (
            <div key={id} className="flex items-center gap-2 text-xs">
              <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
              <span className="font-mono">{id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}