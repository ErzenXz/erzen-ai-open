import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Star } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const PROVIDER_CONFIGS = {
  openai: {
    name: "OpenAI",
    models: [
      "gpt-4o-mini-2024-07-18",
      "chatgpt-4o-latest", 
      "o3-mini",
      "o4-mini",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo"
    ],
    icon: "🤖",
  },
  google: {
    name: "Google AI",
    models: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite", 
      "gemini-2.5-pro-preview-05-06",
      "gemini-2.5-flash-preview-05-20",
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ],
    icon: "🔍",
  },
  anthropic: {
    name: "Anthropic",
    models: [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-20241022",
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229"
    ],
    icon: "🧠",
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      "deepseek/deepseek-chat-v3-0324:free",
      "deepseek/deepseek-r1:free",
      "tngtech/deepseek-r1t-chimera:free",
      "deepseek/deepseek-prover-v2:free",
      "mistralai/devstral-small:free",
      "qwen/qwen2.5-vl-72b-instruct:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
      "google/gemma-3-27b-it:free",
      "rekaai/reka-flash-3:free",
      "google/gemini-2.5-pro-exp-03-25:free",
      "qwen/qwen3-235b-a22b:free",
      "qwen/qwen3-30b-a3b:free",
      "qwen/qwen3-32b:free",
      "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-pro-1.5",
      "meta-llama/llama-3.1-405b-instruct",
      "mistralai/mixtral-8x7b-instruct",
      "cohere/command-r-plus",
    ],
    icon: "🔀",
  },
  groq: {
    name: "Groq",
    models: [
      "deepseek-r1-distill-llama-70b",
      "deepseek-r1-distill-qwen-32b",
      "llama-3.3-70b-versatile",
      "llama-3.2-90b-vision-preview",
      "llama3-70b-8192",
      "qwen-qwq-32b",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "compound-beta",
      "compound-beta-mini",
      "llama-3.1-405b-reasoning",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    icon: "⚡",
  },
  deepseek: {
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder"],
    icon: "🔍",
  },
  grok: {
    name: "Grok",
    models: ["grok-beta", "grok-vision-beta"],
    icon: "🚀",
  },
  cohere: {
    name: "Cohere",
    models: ["command-r-plus", "command-r", "command"],
    icon: "🎯",
  },
  mistral: {
    name: "Mistral AI",
    models: [
      "accounts/fireworks/models/mistral-small-24b-instruct-2501",
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest", 
      "codestral-latest",
    ],
    icon: "🌟",
  },
};

interface ModelSelectorProps {
  selectedProvider: keyof typeof PROVIDER_CONFIGS;
  selectedModel: string;
  onModelSelect: (provider: keyof typeof PROVIDER_CONFIGS, model: string) => void;
}

export function ModelSelector({ selectedProvider, selectedModel, onModelSelect }: ModelSelectorProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "all">("favorites");
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const preferences = useQuery(api.preferences.get);
  const userApiKeys = useQuery(api.apiKeys.list) || [];
  const toggleFavoriteModel = useMutation(api.preferences.toggleFavoriteModel);
  const getAvailableProviders = useAction(api.ai.getAvailableProviders);

  const favoriteModels = preferences?.favoriteModels || [];

  // Load available providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await getAvailableProviders();
        console.log("Available providers from backend:", providers);
        setAvailableProviders(providers);
      } catch (error) {
        console.error("Failed to load available providers:", error);
        // Fallback to basic logic
        const fallbackProviders = Object.keys(PROVIDER_CONFIGS).filter(provider => {
          if (provider === "openai" || provider === "google") return true;
          return userApiKeys.some(key => key.provider === provider && key.hasKey);
        });
        console.log("Using fallback providers:", fallbackProviders);
        setAvailableProviders(fallbackProviders);
      }
    };
    loadProviders();
  }, [getAvailableProviders, userApiKeys]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModelSelectInternal = (provider: keyof typeof PROVIDER_CONFIGS, model: string) => {
    onModelSelect(provider, model);
    setShowModelSelector(false);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, provider: string, model: string) => {
    e.stopPropagation();
    await toggleFavoriteModel({ provider, model });
  };

  const isFavorite = (provider: string, model: string) => {
    return favoriteModels.some(fav => fav.provider === provider && fav.model === model);
  };

  const getFavoriteModels = () => {
    return favoriteModels.filter(fav => 
      availableProviders.includes(fav.provider) &&
      PROVIDER_CONFIGS[fav.provider as keyof typeof PROVIDER_CONFIGS]?.models.includes(fav.model)
    );
  };

  return (
    <div className="relative" ref={modelSelectorRef}>
      <button
        onClick={() => setShowModelSelector(!showModelSelector)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
      >
        <span>{PROVIDER_CONFIGS[selectedProvider].icon}</span>
        <span className="font-medium">{PROVIDER_CONFIGS[selectedProvider].name}</span>
        <span className="text-gray-600">•</span>
        <span className="text-gray-600 max-w-32 truncate">{selectedModel}</span>
        <ChevronDown size={16} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
      </button>

      {showModelSelector && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-80 max-h-80 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "favorites"
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Star size={14} className="inline mr-1" />
              Favorites
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "all"
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Models
            </button>
          </div>

          <div className="overflow-y-auto max-h-60">
            {activeTab === "favorites" ? (
              <div>
                {getFavoriteModels().length > 0 ? (
                  getFavoriteModels().map(fav => (
                    <button
                      key={`${fav.provider}:${fav.model}`}
                      onClick={() => handleModelSelectInternal(fav.provider as keyof typeof PROVIDER_CONFIGS, fav.model)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${
                        selectedProvider === fav.provider && selectedModel === fav.model
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{PROVIDER_CONFIGS[fav.provider as keyof typeof PROVIDER_CONFIGS].icon}</span>
                        <span className="font-medium">{PROVIDER_CONFIGS[fav.provider as keyof typeof PROVIDER_CONFIGS].name}</span>
                        <span className="text-gray-500">•</span>
                        <span>{fav.model}</span>
                      </div>
                      <Star size={14} className="text-yellow-500 fill-current" />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No favorite models yet. Star models in the "All Models" tab to add them here.
                  </div>
                )}
              </div>
            ) : (
              <div>
                {availableProviders.map(provider => (
                  <div key={provider} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-3 py-2 bg-gray-50 font-medium text-sm text-gray-700 flex items-center gap-2">
                      <span>{PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS].icon}</span>
                      {PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS].name}
                      {(provider === "openai" || provider === "google") && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Built-in</span>
                      )}
                    </div>
                    {PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS].models.map(model => (
                      <button
                        key={model}
                        onClick={() => handleModelSelectInternal(provider as keyof typeof PROVIDER_CONFIGS, model)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${
                          selectedProvider === provider && selectedModel === model
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <span>{model}</span>
                        <button
                          onClick={(e) => handleToggleFavorite(e, provider, model)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Star 
                            size={14} 
                            className={isFavorite(provider, model) ? "text-yellow-500 fill-current" : "text-gray-400"} 
                          />
                        </button>
                      </button>
                    ))}
                  </div>
                ))}
                
                {availableProviders.length <= 2 && (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    Add API keys in settings to access more providers
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
