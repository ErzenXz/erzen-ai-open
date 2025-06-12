import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Eye, EyeOff, Key, Trash2, Zap, Infinity } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
  preferences: any;
}

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
    keyPlaceholder: "sk-...",
    description: "GPT models from OpenAI",
    hasBuiltIn: true,
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
    keyPlaceholder: "AIza...",
    description: "Gemini models from Google",
    hasBuiltIn: true,
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
    keyPlaceholder: "sk-ant-...",
    description: "Claude models from Anthropic",
    hasBuiltIn: true,
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
    keyPlaceholder: "sk-or-...",
    description: "Access to multiple AI models",
    hasBuiltIn: true,
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
    keyPlaceholder: "gsk_...",
    description: "Ultra-fast inference",
    hasBuiltIn: true,
  },
  deepseek: {
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder"],
    keyPlaceholder: "sk-...",
    description: "Reasoning and coding models",
    hasBuiltIn: true,
  },
  grok: {
    name: "Grok (xAI)",
    models: ["grok-beta", "grok-vision-beta"],
    keyPlaceholder: "xai-...",
    description: "Elon's AI with real-time data",
    hasBuiltIn: true,
  },
  cohere: {
    name: "Cohere",
    models: ["command-r-plus", "command-r", "command"],
    keyPlaceholder: "co_...",
    description: "Enterprise-grade language models",
    hasBuiltIn: true,
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
    keyPlaceholder: "...",
    description: "European AI models",
    hasBuiltIn: true,
  },
  tavily: {
    name: "Tavily Search",
    models: [],
    keyPlaceholder: "tvly-...",
    description: "Real-time web search API",
    hasBuiltIn: true,
  },
  openweather: {
    name: "OpenWeatherMap",
    models: [],
    keyPlaceholder: "...",
    description: "Weather data API",
    hasBuiltIn: true,
  },
};

export function SettingsModal({ onClose, preferences }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"preferences" | "apikeys" | "usage">("preferences");
  const [settings, setSettings] = useState({
    aiProvider: "openai" as "openai" | "anthropic" | "google" | "openrouter" | "groq" | "deepseek" | "grok" | "cohere" | "mistral",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
  });
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const updatePreferences = useMutation(api.preferences.update);
  const upsertApiKey = useMutation(api.apiKeys.upsert);
  const removeApiKey = useMutation(api.apiKeys.remove);
  const userApiKeys = useQuery(api.apiKeys.list) || [];
  const usage = useQuery(api.usage.get);
  const limits = useQuery(api.usage.getLimits);

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const handleSavePreferences = async () => {
    await updatePreferences(settings);
  };

  const handleSaveApiKey = async (provider: keyof typeof PROVIDER_CONFIGS) => {
    const key = apiKeys[provider];
    if (key?.trim()) {
      await upsertApiKey({ provider, apiKey: key.trim() });
      setApiKeys(prev => ({ ...prev, [provider]: "" }));
    }
  };

  const handleRemoveApiKey = async (provider: keyof typeof PROVIDER_CONFIGS) => {
    await removeApiKey({ provider });
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const hasApiKey = (provider: string) => {
    return userApiKeys.some(key => key.provider === provider && key.hasKey);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-6 py-3 font-medium ${
              activeTab === "preferences"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI Preferences
          </button>
          <button
            onClick={() => setActiveTab("apikeys")}
            className={`px-6 py-3 font-medium ${
              activeTab === "apikeys"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-6 py-3 font-medium ${
              activeTab === "usage"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Usage & Plans
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "preferences" ? (
            <div className="space-y-6">
              {/* AI Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    aiProvider: e.target.value as "openai" | "anthropic" | "google" | "openrouter" | "groq" | "deepseek" | "grok" | "cohere" | "mistral",
                    model: PROVIDER_CONFIGS[e.target.value as keyof typeof PROVIDER_CONFIGS].models[0] || "",
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PROVIDER_CONFIGS)
                    .filter(([key]) => !["tavily", "openweather"].includes(key))
                    .map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              {PROVIDER_CONFIGS[settings.aiProvider].models.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROVIDER_CONFIGS[settings.aiProvider].models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : activeTab === "apikeys" ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Built-in API Keys vs Your Own</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Built-in Keys:</strong> Free usage with monthly limits (messages & searches count)</p>
                      <p><strong>Your Keys:</strong> <Infinity className="inline w-4 h-4" /> Unlimited usage - no limits or counting!</p>
                    </div>
                  </div>
                </div>
              </div>

              {Object.entries(PROVIDER_CONFIGS).map(([provider, config]) => (
                <div key={provider} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{config.name}</h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasApiKey(provider) && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                          <Infinity size={12} />
                          Unlimited
                        </span>
                      )}
                      {config.hasBuiltIn && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                          <Zap size={12} />
                          Built-in
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showKeys[provider] ? "text" : "password"}
                        value={apiKeys[provider] || ""}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                        placeholder={config.keyPlaceholder}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(provider)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSaveApiKey(provider as keyof typeof PROVIDER_CONFIGS)}
                      disabled={!apiKeys[provider]?.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Key size={16} />
                      Save
                    </button>
                    {hasApiKey(provider) && (
                      <button
                        onClick={() => handleRemoveApiKey(provider as keyof typeof PROVIDER_CONFIGS)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {!hasApiKey(provider) && config.hasBuiltIn && (
                    <p className="text-xs text-gray-500 mt-2">
                      Using built-in key with usage limits. Add your own key for unlimited access.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Plan</h3>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium capitalize">
                    {usage?.plan || "Free"}
                  </span>
                  <span className="text-gray-600">
                    Resets on {usage?.resetDate ? new Date(usage.resetDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <p className="text-sm text-blue-800 mt-2">
                  💡 Add your own API keys for unlimited usage without counting against these limits!
                </p>
              </div>

              {/* Usage Stats */}
              {usage && limits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Messages Usage */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Messages (Built-in Keys Only)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>{usage.messagesUsed} / {limits.messages}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getUsageColor(getUsagePercentage(usage.messagesUsed, limits.messages))}`}
                          style={{ width: `${getUsagePercentage(usage.messagesUsed, limits.messages)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Your own API keys = unlimited messages</p>
                    </div>
                  </div>

                  {/* Searches Usage */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Web Searches (Built-in Keys Only)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>{usage.searchesUsed} / {limits.searches}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getUsageColor(getUsagePercentage(usage.searchesUsed, limits.searches))}`}
                          style={{ width: `${getUsagePercentage(usage.searchesUsed, limits.searches)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Your own API keys = unlimited searches</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Free", messages: 50, searches: 10, price: "$0", current: usage?.plan === "free" },
                  { name: "Pro", messages: 500, searches: 200, price: "$9.99", current: usage?.plan === "pro" },
                  { name: "Ultra", messages: 2500, searches: 1000, price: "$19.99", current: usage?.plan === "ultra" },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-lg p-4 ${
                      plan.current
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <p className="text-2xl font-bold text-blue-600 my-2">{plan.price}</p>
                      <p className="text-sm text-gray-600 mb-4">per month</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Messages</span>
                          <span className="font-medium">{plan.messages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Searches</span>
                          <span className="font-medium">{plan.searches}</span>
                        </div>
                      </div>

                      {plan.current ? (
                        <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          Current Plan
                        </div>
                      ) : (
                        <div className="mt-4 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm cursor-not-allowed">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Infinity className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Pro Tip: Unlimited Usage</h4>
                    <p className="text-sm text-green-800">
                      Add your own API keys in the API Keys tab to bypass all usage limits completely. 
                      Your messages and searches won't count against these quotas when using your own keys!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {activeTab === "preferences" && (
            <button
              onClick={async () => {
                await handleSavePreferences();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
