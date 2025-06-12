import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    lastMessageAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("file")),
          url: v.string(),
          name: v.string(),
          size: v.optional(v.number()),
        })
      )
    ),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          arguments: v.string(),
          result: v.optional(v.string()),
        })
      )
    ),
  }).index("by_conversation", ["conversationId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    aiProvider: v.union(
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
    model: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    enabledTools: v.optional(v.array(v.string())),
    favoriteModels: v.optional(
      v.array(
        v.object({
          provider: v.string(),
          model: v.string(),
        })
      )
    ),
  }).index("by_user", ["userId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter"),
      v.literal("groq"),
      v.literal("deepseek"),
      v.literal("grok"),
      v.literal("cohere"),
      v.literal("mistral"),
      v.literal("tavily"),
      v.literal("openweather")
    ),
    apiKey: v.string(),
    isActive: v.boolean(),
  }).index("by_user_provider", ["userId", "provider"]),

  userUsage: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("ultra")),
    messagesUsed: v.number(),
    searchesUsed: v.number(),
    resetDate: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
