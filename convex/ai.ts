"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { api } from "./_generated/api";

// Provider configurations with updated models
const PROVIDER_CONFIGS = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
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
      "gpt-3.5-turbo",
    ],
  },
  google: {
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro-preview-05-06",
      "gemini-2.5-flash-preview-05-20",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    models: [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-20241022",
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229",
    ],
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
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
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
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
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-coder"],
  },
  grok: {
    name: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    models: ["grok-beta", "grok-vision-beta"],
  },
  cohere: {
    name: "Cohere",
    baseUrl: "https://api.cohere.ai/v1",
    models: ["command-r-plus", "command-r", "command"],
  },
  mistral: {
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    models: [
      "accounts/fireworks/models/mistral-small-24b-instruct-2501",
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "codestral-latest",
    ],
  },
};

// Helper function to perform Tavily search
async function performTavilySearch(
  ctx: any,
  query: string,
  searchDepth: "basic" | "advanced" = "basic",
  shouldCountUsage: boolean = true
): Promise<string> {
  try {
    const apiKeyRecord = await ctx.runQuery(api.apiKeys.getByProvider, {
      provider: "tavily",
    });

    // Use built-in Tavily key if available, otherwise user's key
    let apiKey = process.env.TAVILY_API_KEY || "";
    let usingUserKey = false;

    if (apiKeyRecord?.apiKey) {
      apiKey = apiKeyRecord.apiKey;
      usingUserKey = true;
    }

    if (!apiKey) {
      return `Search results for "${query}": This is a simulated search result. Configure your Tavily API key in settings for real web search.`;
    }

    // Only count usage if using built-in key
    if (!usingUserKey && shouldCountUsage) {
      const usage = await ctx.runQuery(api.usage.get);
      const limits = await ctx.runQuery(api.usage.getLimits);

      if (usage && usage.searchesUsed >= limits.searches) {
        return `Search limit reached (${limits.searches}). Add your own Tavily API key in settings for unlimited searches.`;
      }

      await ctx.runMutation(api.usage.incrementSearches);
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        include_answer: true,
        include_images: false,
        include_raw_content: searchDepth === "advanced",
        max_results: searchDepth === "advanced" ? 8 : 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const results = data.results
        .map(
          (result: any) => `${result.title}: ${result.content} (${result.url})`
        )
        .join("\n\n");

      return `Search results for "${query}":\n\n${results}${data.answer ? `\n\nSummary: ${data.answer}` : ""}`;
    }

    return `No results found for "${query}"`;
  } catch (error) {
    console.error("Tavily search error:", error);
    return `Search failed for "${query}": ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Helper function to get weather data
async function getWeatherData(ctx: any, location: string): Promise<string> {
  try {
    const apiKeyRecord = await ctx.runQuery(api.apiKeys.getByProvider, {
      provider: "openweather",
    });

    // Use built-in OpenWeather key if available, otherwise user's key
    let apiKey = process.env.OPENWEATHER_API_KEY || "";

    if (apiKeyRecord?.apiKey) {
      apiKey = apiKeyRecord.apiKey;
    }

    if (!apiKey) {
      return `Weather for ${location}: This is simulated weather data. Configure your OpenWeatherMap API key in settings for real weather data. Current: 22°C, Partly cloudy, Humidity: 65%, Wind: 8 km/h NE`;
    }

    // Get coordinates first
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    );

    if (!geoResponse.ok) {
      throw new Error(`Geocoding API error: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    if (!geoData.length) {
      return `Weather data not found for "${location}". Please check the location name.`;
    }

    const { lat, lon, name, country } = geoData[0];

    // Get weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weather = await weatherResponse.json();

    return `Weather for ${name}, ${country}:
Current: ${Math.round(weather.main.temp)}°C, ${weather.weather[0].description}
Feels like: ${Math.round(weather.main.feels_like)}°C
Humidity: ${weather.main.humidity}%
Wind: ${Math.round(weather.wind.speed * 3.6)} km/h
Pressure: ${weather.main.pressure} hPa
Visibility: ${weather.visibility / 1000} km`;
  } catch (error) {
    console.error("Weather API error:", error);
    return `Weather data unavailable for "${location}": ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export const generateStreamingResponse: any = action({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("user"),
          v.literal("assistant"),
          v.literal("system")
        ),
        content: v.string(),
      })
    ),
    provider: v.optional(
      v.union(
        v.literal("openai"),
        v.literal("anthropic"),
        v.literal("google"),
        v.literal("openrouter"),
        v.literal("groq"),
        v.literal("deepseek"),
        v.literal("grok"),
        v.literal("cohere"),
        v.literal("mistral")
      )
    ),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    enabledTools: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<any> => {
    const provider = args.provider || "openai";
    const model = args.model || PROVIDER_CONFIGS[provider].models[0];
    const temperature = args.temperature ?? 1;
    const maxTokens = args.maxTokens ?? 1_000_000;
    const enabledTools = args.enabledTools || [];

    // Get user's API key for the provider
    const apiKeyRecord = await ctx.runQuery(api.apiKeys.getByProvider, {
      provider,
    });

    let aiModel;
    let apiKey = "";
    let baseURL = "";
    let usingUserKey = false;

    // Determine which API key to use
    if (apiKeyRecord?.apiKey) {
      // User has their own API key
      apiKey = apiKeyRecord.apiKey;
      baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      usingUserKey = true;
    } else {
      // Use built-in keys
      if (provider === "openai") {
        apiKey =
          process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
        baseURL = process.env.CONVEX_OPENAI_BASE_URL || "";
      } else if (provider === "google") {
        apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
      } else if (provider === "anthropic") {
        apiKey = process.env.ANTHROPIC_API_KEY || "";
      } else if (provider === "openrouter") {
        apiKey = process.env.OPENROUTER_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "groq") {
        apiKey = process.env.GROQ_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "deepseek") {
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "grok") {
        apiKey = process.env.GROK_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "cohere") {
        apiKey = process.env.COHERE_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "mistral") {
        apiKey = process.env.MISTRAL_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      }
    }

    // Only check usage limits if using built-in keys
    if (!usingUserKey) {
      const usage = await ctx.runQuery(api.usage.get);
      const limits = await ctx.runQuery(api.usage.getLimits);

      if (usage && usage.messagesUsed >= limits.messages) {
        throw new Error(
          `Monthly message limit reached (${limits.messages}). Add your own API keys in settings for unlimited usage.`
        );
      }
    }

    // Create tools based on enabled tools
    const availableTools: Record<string, any> = {};

    if (enabledTools.includes("web_search")) {
      availableTools.web_search = tool({
        description: "Search the web for current information",
        parameters: z.object({
          query: z.string().describe("The search query"),
        }),
        execute: async ({ query }): Promise<string> => {
          return await performTavilySearch(ctx, query, "basic", !usingUserKey);
        },
      });
    }

    if (enabledTools.includes("deep_search")) {
      availableTools.deep_search = tool({
        description:
          "Perform a comprehensive deep search with multiple queries for thorough research (uses 3x message pricing)",
        parameters: z.object({
          query: z.string().describe("The main search query"),
          related_queries: z
            .array(z.string())
            .optional()
            .describe("Additional related queries to search"),
        }),
        execute: async ({ query, related_queries = [] }): Promise<string> => {
          // Only increment usage if using built-in keys
          if (!usingUserKey) {
            // Increment usage 3 times for deep search
            await ctx.runMutation(api.usage.incrementMessages);
            await ctx.runMutation(api.usage.incrementMessages);
          }

          const allQueries = [query, ...related_queries.slice(0, 3)]; // Limit to 4 total queries
          const searchPromises = allQueries.map((q) =>
            performTavilySearch(ctx, q, "advanced", !usingUserKey)
          );
          const results = await Promise.all(searchPromises);

          let combinedResults = `Deep search results for "${query}":\n\n`;
          results.forEach((result, index) => {
            combinedResults += `=== Results for "${allQueries[index]}" ===\n${result}\n\n`;
          });

          return combinedResults;
        },
      });
    }

    if (enabledTools.includes("weather")) {
      availableTools.weather = tool({
        description: "Get current weather information for a specific location",
        parameters: z.object({
          location: z
            .string()
            .describe("The city, state/country for weather information"),
        }),
        execute: async ({ location }): Promise<string> => {
          return await getWeatherData(ctx, location);
        },
      });
    }

    if (enabledTools.includes("datetime")) {
      availableTools.datetime = tool({
        description: "Get current date, time, and timezone information",
        parameters: z.object({
          timezone: z
            .string()
            .optional()
            .describe(
              "Specific timezone (e.g., 'America/New_York', 'Europe/London')"
            ),
          format: z
            .enum(["full", "date", "time"])
            .optional()
            .describe("Format type - full, date only, or time only"),
        }),
        execute: async ({ timezone, format = "full" }): Promise<string> => {
          try {
            const now = new Date();
            let dateTime;

            if (timezone) {
              dateTime = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                weekday: "long",
              }).format(now);
            } else {
              dateTime = now.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                weekday: "long",
              });
            }

            if (format === "date") {
              return `Current date: ${now.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                ...(timezone && { timeZone: timezone }),
              })}`;
            } else if (format === "time") {
              return `Current time: ${now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                ...(timezone && { timeZone: timezone }),
              })}`;
            }

            return `Current date and time: ${dateTime}`;
          } catch (error) {
            return `Error getting date/time: ${error instanceof Error ? error.message : "Unknown error"}`;
          }
        },
      });
    }

    if (enabledTools.includes("calculator")) {
      availableTools.calculator = tool({
        description: "Perform mathematical calculations",
        parameters: z.object({
          expression: z
            .string()
            .describe("The mathematical expression to evaluate"),
        }),
        execute: async ({ expression }): Promise<string> => {
          try {
            const result = eval(expression.replace(/[^0-9+\-*/().\s]/g, ""));
            return `Result: ${result}`;
          } catch {
            return `Error: Invalid mathematical expression`;
          }
        },
      });
    }

    // Validate API key is available
    if (!apiKey) {
      throw new Error(
        `No API key available for ${provider}. Please configure your API key in settings or use a provider with built-in support.`
      );
    }

    // Create AI model instance
    if (
      provider === "openai" ||
      provider === "openrouter" ||
      provider === "groq" ||
      provider === "deepseek" ||
      provider === "grok" ||
      provider === "mistral"
    ) {
      aiModel = openai(
        model as any,
        {
          baseURL,
          apiKey,
        } as any
      );
    } else if (provider === "anthropic") {
      aiModel = anthropic(
        model as any,
        {
          apiKey,
        } as any
      );
    } else if (provider === "google") {
      aiModel = google(
        model as any,
        {
          apiKey,
        } as any
      );
    } else if (provider === "cohere") {
      // For Cohere, we'll use OpenAI-compatible format
      aiModel = openai(
        model as any,
        {
          baseURL,
          apiKey,
        } as any
      );
    } else {
      // This branch should theoretically never be hit because we've accounted for all providers,
      // but it provides an extra safeguard at runtime.
      throw new Error("Unsupported provider");
    }

    try {
      // Create an empty assistant message first
      const messageId: any = await ctx.runMutation(api.messages.add, {
        conversationId: args.conversationId,
        role: "assistant",
        content: "",
      });

      // Generate the response using streamText
      const result = await (streamText({
        model: aiModel,
        messages: args.messages,
        tools: availableTools,
        temperature,
        maxTokens,
        maxSteps: 5,
      }) as any);

      let accumulatedContent = "";
      let toolCalls: any[] = [];

      // Process the stream
      for await (const delta of result.textStream) {
        accumulatedContent += delta;

        // Update the message with accumulated content
        await ctx.runMutation(api.messages.update, {
          messageId,
          content: accumulatedContent,
        });

        // Small delay to make streaming visible
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Handle tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        toolCalls = result.toolCalls.map((call: any) => ({
          id: call.toolCallId || `tool_${Date.now()}`,
          name: call.toolName,
          arguments: JSON.stringify(call.args),
          result: undefined,
        }));
      }

      // Final update to ensure the message is complete with tool calls
      await ctx.runMutation(api.messages.update, {
        messageId,
        content:
          accumulatedContent ||
          "I apologize, but I couldn't generate a response.",
      });

      // If there are tool calls, we need to update the message with them
      if (toolCalls.length > 0) {
        // For now, we'll add the tool calls to the existing message
        // In a more sophisticated implementation, we might handle tool execution here
      }

      // Update usage if using built-in keys
      if (!usingUserKey) {
        await ctx.runMutation(api.usage.incrementMessages);
      }

      return {
        messageId,
        content: accumulatedContent,
        usingUserKey,
      };
    } catch (error) {
      console.error("Streaming AI generation error:", error);

      // Save error message as assistant response
      await ctx.runMutation(api.messages.add, {
        conversationId: args.conversationId,
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. ${!usingUserKey ? "Consider adding your own API keys in settings for unlimited usage." : ""}`,
      });

      throw new Error(
        `Failed to generate streaming AI response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

export const generateResponse = action({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("user"),
          v.literal("assistant"),
          v.literal("system")
        ),
        content: v.string(),
      })
    ),
    provider: v.optional(
      v.union(
        v.literal("openai"),
        v.literal("anthropic"),
        v.literal("google"),
        v.literal("openrouter"),
        v.literal("groq"),
        v.literal("deepseek"),
        v.literal("grok"),
        v.literal("cohere"),
        v.literal("mistral")
      )
    ),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    enabledTools: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const provider = args.provider || "openai";
    const model = args.model || PROVIDER_CONFIGS[provider].models[0];
    const temperature = args.temperature ?? 1;
    const maxTokens = args.maxTokens ?? 1_000_000;
    const enabledTools = args.enabledTools || [];

    // Get user's API key for the provider
    const apiKeyRecord = await ctx.runQuery(api.apiKeys.getByProvider, {
      provider,
    });

    let aiModel;
    let apiKey = "";
    let baseURL = "";
    let usingUserKey = false;

    // Determine which API key to use
    if (apiKeyRecord?.apiKey) {
      // User has their own API key
      apiKey = apiKeyRecord.apiKey;
      baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      usingUserKey = true;
    } else {
      // Use built-in keys
      if (provider === "openai") {
        apiKey =
          process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
        baseURL = process.env.CONVEX_OPENAI_BASE_URL || "";
      } else if (provider === "google") {
        apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
      } else if (provider === "anthropic") {
        apiKey = process.env.ANTHROPIC_API_KEY || "";
      } else if (provider === "openrouter") {
        apiKey = process.env.OPENROUTER_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "groq") {
        apiKey = process.env.GROQ_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "deepseek") {
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "grok") {
        apiKey = process.env.GROK_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "cohere") {
        apiKey = process.env.COHERE_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      } else if (provider === "mistral") {
        apiKey = process.env.MISTRAL_API_KEY || "";
        baseURL = PROVIDER_CONFIGS[provider].baseUrl;
      }
    }

    // Only check usage limits if using built-in keys
    if (!usingUserKey) {
      const usage = await ctx.runQuery(api.usage.get);
      const limits = await ctx.runQuery(api.usage.getLimits);

      if (usage && usage.messagesUsed >= limits.messages) {
        throw new Error(
          `Monthly message limit reached (${limits.messages}). Add your own API keys in settings for unlimited usage.`
        );
      }
    }

    // Create tools based on enabled tools
    const availableTools: Record<string, any> = {};

    if (enabledTools.includes("web_search")) {
      availableTools.web_search = tool({
        description: "Search the web for current information",
        parameters: z.object({
          query: z.string().describe("The search query"),
        }),
        execute: async ({ query }): Promise<string> => {
          return await performTavilySearch(ctx, query, "basic", !usingUserKey);
        },
      });
    }

    if (enabledTools.includes("deep_search")) {
      availableTools.deep_search = tool({
        description:
          "Perform a comprehensive deep search with multiple queries for thorough research (uses 3x message pricing)",
        parameters: z.object({
          query: z.string().describe("The main search query"),
          related_queries: z
            .array(z.string())
            .optional()
            .describe("Additional related queries to search"),
        }),
        execute: async ({ query, related_queries = [] }): Promise<string> => {
          // Only increment usage if using built-in keys
          if (!usingUserKey) {
            // Increment usage 3 times for deep search
            await ctx.runMutation(api.usage.incrementMessages);
            await ctx.runMutation(api.usage.incrementMessages);
          }

          const allQueries = [query, ...related_queries.slice(0, 3)]; // Limit to 4 total queries
          const searchPromises = allQueries.map((q) =>
            performTavilySearch(ctx, q, "advanced", !usingUserKey)
          );
          const results = await Promise.all(searchPromises);

          let combinedResults = `Deep search results for "${query}":\n\n`;
          results.forEach((result, index) => {
            combinedResults += `=== Results for "${allQueries[index]}" ===\n${result}\n\n`;
          });

          return combinedResults;
        },
      });
    }

    if (enabledTools.includes("weather")) {
      availableTools.weather = tool({
        description: "Get current weather information for a specific location",
        parameters: z.object({
          location: z
            .string()
            .describe("The city, state/country for weather information"),
        }),
        execute: async ({ location }): Promise<string> => {
          return await getWeatherData(ctx, location);
        },
      });
    }

    if (enabledTools.includes("datetime")) {
      availableTools.datetime = tool({
        description: "Get current date, time, and timezone information",
        parameters: z.object({
          timezone: z
            .string()
            .optional()
            .describe(
              "Specific timezone (e.g., 'America/New_York', 'Europe/London')"
            ),
          format: z
            .enum(["full", "date", "time"])
            .optional()
            .describe("Format type - full, date only, or time only"),
        }),
        execute: async ({ timezone, format = "full" }): Promise<string> => {
          try {
            const now = new Date();
            let dateTime;

            if (timezone) {
              dateTime = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                weekday: "long",
              }).format(now);
            } else {
              dateTime = now.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                weekday: "long",
              });
            }

            if (format === "date") {
              return `Current date: ${now.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                ...(timezone && { timeZone: timezone }),
              })}`;
            } else if (format === "time") {
              return `Current time: ${now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
                ...(timezone && { timeZone: timezone }),
              })}`;
            }

            return `Current date and time: ${dateTime}`;
          } catch (error) {
            return `Error getting date/time: ${error instanceof Error ? error.message : "Unknown error"}`;
          }
        },
      });
    }

    if (enabledTools.includes("calculator")) {
      availableTools.calculator = tool({
        description: "Perform mathematical calculations",
        parameters: z.object({
          expression: z
            .string()
            .describe("The mathematical expression to evaluate"),
        }),
        execute: async ({ expression }): Promise<string> => {
          try {
            const result = eval(expression.replace(/[^0-9+\-*/().\s]/g, ""));
            return `Result: ${result}`;
          } catch {
            return `Error: Invalid mathematical expression`;
          }
        },
      });
    }

    try {
      // Validate API key is available
      if (!apiKey) {
        throw new Error(
          `No API key available for ${provider}. Please configure your API key in settings or use a provider with built-in support.`
        );
      }

      if (
        provider === "openai" ||
        provider === "openrouter" ||
        provider === "groq" ||
        provider === "deepseek" ||
        provider === "grok" ||
        provider === "mistral"
      ) {
        aiModel = openai(
          model as any,
          {
            baseURL,
            apiKey,
          } as any
        );
      } else if (provider === "anthropic") {
        aiModel = anthropic(
          model as any,
          {
            apiKey,
          } as any
        );
      } else if (provider === "google") {
        aiModel = google(
          model as any,
          {
            apiKey,
          } as any
        );
      } else if (provider === "cohere") {
        // For Cohere, we'll use OpenAI-compatible format
        aiModel = openai(
          model as any,
          {
            baseURL,
            apiKey,
          } as any
        );
      } else {
        // This branch should theoretically never be hit because we've accounted for all providers,
        // but it provides an extra safeguard at runtime.
        throw new Error("Unsupported provider");
      }

      const result = await generateText({
        model: aiModel,
        messages: args.messages,
        tools: availableTools,
        temperature,
        maxTokens,
        maxSteps: 5,
      });

      // Only update usage if using built-in keys
      if (!usingUserKey) {
        await ctx.runMutation(api.usage.incrementMessages);
      }

      // Save the assistant's response with proper tool calls format
      const toolCalls =
        result.toolCalls?.map((call) => ({
          id: call.toolCallId || `tool_${Date.now()}`,
          name: call.toolName,
          arguments: JSON.stringify(call.args),
          result: undefined,
        })) || undefined;

      await ctx.runMutation(api.messages.add, {
        conversationId: args.conversationId,
        role: "assistant",
        content:
          result.text || "I apologize, but I couldn't generate a response.",
        toolCalls,
      });

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        usingUserKey, // Return this so UI can show usage info
      };
    } catch (error) {
      console.error("AI generation error:", error);

      // Save error message as assistant response so user can see what went wrong
      await ctx.runMutation(api.messages.add, {
        conversationId: args.conversationId,
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. ${!usingUserKey ? "Consider adding your own API keys in settings for unlimited usage." : ""}`,
      });

      throw new Error(
        `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

export const getProviderModels = action({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter"),
      v.literal("groq"),
      v.literal("deepseek"),
      v.literal("grok"),
      v.literal("cohere"),
      v.literal("mistral")
    ),
  },
  handler: async (ctx, args) => {
    return PROVIDER_CONFIGS[args.provider];
  },
});

export const getAvailableProviders = action({
  args: {},
  handler: async (ctx) => {
    const availableProviders: string[] = [];

    // Get user's API keys
    const userApiKeys = await ctx.runQuery(api.apiKeys.list);

    // Check each provider
    for (const provider of Object.keys(PROVIDER_CONFIGS)) {
      let hasApiKey = false;

      // Check if user has API key in database
      const userApiKey = userApiKeys.find(
        (key) => key.provider === provider && key.hasKey
      );
      if (userApiKey) {
        hasApiKey = true;
      } else {
        // Check if there's a built-in API key in environment variables
        if (provider === "openai") {
          hasApiKey = !!(
            process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY
          );
        } else if (provider === "google") {
          hasApiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        } else if (provider === "anthropic") {
          hasApiKey = !!process.env.ANTHROPIC_API_KEY;
        } else if (provider === "openrouter") {
          hasApiKey = !!process.env.OPENROUTER_API_KEY;
        } else if (provider === "groq") {
          hasApiKey = !!process.env.GROQ_API_KEY;
        } else if (provider === "deepseek") {
          hasApiKey = !!process.env.DEEPSEEK_API_KEY;
        } else if (provider === "grok") {
          hasApiKey = !!process.env.GROK_API_KEY;
        } else if (provider === "cohere") {
          hasApiKey = !!process.env.COHERE_API_KEY;
        } else if (provider === "mistral") {
          hasApiKey = !!process.env.MISTRAL_API_KEY;
        }
      }

      if (hasApiKey) {
        availableProviders.push(provider);
      }
    }

    return availableProviders;
  },
});
