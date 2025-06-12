import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId))
      .collect();

    // Return without exposing the actual API keys
    return apiKeys.map(key => ({
      _id: key._id,
      provider: key.provider,
      isActive: key.isActive,
      hasKey: !!key.apiKey,
    }));
  },
});

export const getByProvider = query({
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
      v.literal("mistral"),
      v.literal("tavily"),
      v.literal("openweather")
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", args.provider))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();
  },
});

export const upsert = mutation({
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
      v.literal("mistral"),
      v.literal("tavily"),
      v.literal("openweather")
    ),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", args.provider))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        isActive: true,
      });
    } else {
      await ctx.db.insert("apiKeys", {
        userId,
        provider: args.provider,
        apiKey: args.apiKey,
        isActive: true,
      });
    }
  },
});

export const remove = mutation({
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
      v.literal("mistral"),
      v.literal("tavily"),
      v.literal("openweather")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", args.provider))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
