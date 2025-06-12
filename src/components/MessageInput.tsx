import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Send, Paperclip, Image, ChevronDown, Wrench, Search, Calculator, Clock, CloudRain } from "lucide-react";
import { ModelSelector } from "./ModelSelector";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any[], selectedModel?: { provider: string; model: string }, enabledTools?: string[]) => void;
  disabled?: boolean;
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
    name: "Mistral",
    models: [
      "accounts/fireworks/models/mistral-small-24b-instruct-2501",
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "codestral-latest",
    ],
    icon: "🌪️",
  },
};

const AVAILABLE_TOOLS = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for current information",
    icon: Search,
    requiresApiKey: "tavily",
  },
  {
    id: "deep_search",
    name: "Deep Search",
    description: "Comprehensive research with multiple queries (3x pricing)",
    icon: Search,
    requiresApiKey: "tavily",
    premium: true,
  },
  {
    id: "weather",
    name: "Weather",
    description: "Get current weather information",
    icon: CloudRain,
    requiresApiKey: "openweather",
  },
  {
    id: "datetime",
    name: "Date & Time",
    description: "Get current date and time information",
    icon: Clock,
    requiresApiKey: null,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    icon: Calculator,
    requiresApiKey: null,
  },
];

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof PROVIDER_CONFIGS>("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolSelectorRef = useRef<HTMLDivElement>(null);

  const preferences = useQuery(api.preferences.get);
  const userApiKeys = useQuery(api.apiKeys.list) || [];
  const updatePreferences = useMutation(api.preferences.update);

  // Initialize from preferences
  useEffect(() => {
    if (preferences) {
      if (preferences.enabledTools) {
        setEnabledTools(preferences.enabledTools);
      }
      if (preferences.aiProvider) {
        setSelectedProvider(preferences.aiProvider);
      }
      if (preferences.model) {
        setSelectedModel(preferences.model);
      }
    }
  }, [preferences]);

  // Check if tool is available (has required API key or doesn't need one)
  const isToolAvailable = (tool: typeof AVAILABLE_TOOLS[0]) => {
    if (!tool.requiresApiKey) return true;

    // Check if user has their own API key
    const hasUserApiKey = userApiKeys.some(key => key.provider === tool.requiresApiKey && key.hasKey);
    if (hasUserApiKey) return true;

    // For tools that have built-in support, they're always available
    // These tools will use built-in API keys when user doesn't have their own
    if (tool.requiresApiKey === "tavily" || tool.requiresApiKey === "openweather") {
      return true; // Built-in support available
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(
      message, 
      attachments.length > 0 ? attachments : undefined,
      { provider: selectedProvider, model: selectedModel },
      enabledTools
    );
    setMessage("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      type,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelSelect = async (provider: keyof typeof PROVIDER_CONFIGS, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);

    // Save to preferences - only pass valid fields, excluding Convex-generated fields
    if (preferences) {
      await updatePreferences({
        aiProvider: provider,
        model: model,
        temperature: preferences.temperature,
        maxTokens: preferences.maxTokens,
        enabledTools: preferences.enabledTools,
        favoriteModels: preferences.favoriteModels,
      });
    }
  };

  const toggleTool = async (toolId: string) => {
    const newEnabledTools = enabledTools.includes(toolId)
      ? enabledTools.filter(id => id !== toolId)
      : [...enabledTools, toolId];

    setEnabledTools(newEnabledTools);

    // Save to preferences - only pass valid fields, excluding Convex-generated fields
    if (preferences) {
      await updatePreferences({
        aiProvider: preferences.aiProvider,
        model: preferences.model,
        temperature: preferences.temperature,
        maxTokens: preferences.maxTokens,
        enabledTools: newEnabledTools,
        favoriteModels: preferences.favoriteModels,
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolSelectorRef.current && !toolSelectorRef.current.contains(event.target as Node)) {
        setShowToolSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type === "image" ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <span className="text-xs text-center p-1">{attachment.name.slice(0, 10)}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex gap-2">
        {/* Model Selector */}
        <ModelSelector
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />

        {/* Tools Selector */}
        <div className="relative" ref={toolSelectorRef}>
          <button
            onClick={() => setShowToolSelector(!showToolSelector)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              enabledTools.length > 0 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Wrench size={16} />
            <span className="font-medium">Tools</span>
            {enabledTools.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {enabledTools.length}
              </span>
            )}
            <ChevronDown size={16} className={`transition-transform ${showToolSelector ? 'rotate-180' : ''}`} />
          </button>

          {showToolSelector && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-80 max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-900 mb-1">Available Tools</h3>
                <p className="text-xs text-gray-600">Select tools to enhance AI capabilities</p>
              </div>
              
              {AVAILABLE_TOOLS.map(tool => {
                const IconComponent = tool.icon;
                const isAvailable = isToolAvailable(tool);
                const isEnabled = enabledTools.includes(tool.id);
                const hasUserApiKey = tool.requiresApiKey ? userApiKeys.some(key => key.provider === tool.requiresApiKey && key.hasKey) : false;
                const hasBuiltInSupport = tool.requiresApiKey === "tavily" || tool.requiresApiKey === "openweather";

                return (
                  <div key={tool.id} className="border-b border-gray-100 last:border-b-0">
                    <button
                      onClick={() => void toggleTool(tool.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{tool.name}</span>
                            {tool.premium && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                3x Cost
                              </span>
                            )}
                            {tool.requiresApiKey && hasUserApiKey && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                Your API Key
                              </span>
                            )}
                            {tool.requiresApiKey && !hasUserApiKey && hasBuiltInSupport && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Built-in
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isEnabled
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isEnabled && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
              
              <div className="p-3 text-xs text-gray-500 text-center border-t border-gray-100">
                <div className="flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Built-in support
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Your API key
                  </span>
                </div>
                <div className="mt-1">Configure API keys in settings for unlimited usage</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-32"
            disabled={disabled}
            rows={1}
          />
          
          {/* Attachment buttons */}
          <div className="absolute right-3 top-3 flex gap-1">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              <Image size={18} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              <Paperclip size={18} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, "file")}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, "image")}
        />
      </form>
    </div>
  );
}
