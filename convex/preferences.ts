import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return (
      preferences || {
        aiProvider: "openai" as const,
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
        enabledTools: ["web_search", "calculator", "datetime"],
        favoriteModels: [],
      }
    );
  },
});

export const update = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        ...args,
      });
    }
  },
});

export const toggleFavoriteModel = mutation({
  args: {
    provider: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const currentFavorites = existing?.favoriteModels || [];
    const favoriteKey = `${args.provider}:${args.model}`;

    // Check if this model is already a favorite
    const existingIndex = currentFavorites.findIndex(
      (fav) => fav.provider === args.provider && fav.model === args.model
    );

    let newFavorites;
    if (existingIndex >= 0) {
      // Remove from favorites
      newFavorites = currentFavorites.filter(
        (_, index) => index !== existingIndex
      );
    } else {
      // Add to favorites
      newFavorites = [
        ...currentFavorites,
        { provider: args.provider, model: args.model },
      ];
    }

    if (existing) {
      await ctx.db.patch(existing._id, { favoriteModels: newFavorites });
    } else {
      // Create new preferences with default values
      await ctx.db.insert("userPreferences", {
        userId,
        aiProvider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
        enabledTools: ["web_search", "calculator", "datetime"],
        favoriteModels: newFavorites,
      });
    }

    return newFavorites;
  },
});
