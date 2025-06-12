import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const PLAN_LIMITS = {
  free: { messages: 50, searches: 10 },
  pro: { messages: 500, searches: 200 },
  ultra: { messages: 2500, searches: 1000 },
};

async function ensureUsageRecord(ctx: any, userId: any) {
  let usage = await ctx.db
    .query("userUsage")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  if (!usage) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);

    const usageId = await ctx.db.insert("userUsage", {
      userId,
      plan: "free",
      messagesUsed: 0,
      searchesUsed: 0,
      resetDate: resetDate.getTime(),
    });

    usage = await ctx.db.get(usageId);
  }

  // Check if we need to reset monthly usage
  if (usage && Date.now() >= usage.resetDate) {
    const nextResetDate = new Date(usage.resetDate);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    await ctx.db.patch(usage._id, {
      messagesUsed: 0,
      searchesUsed: 0,
      resetDate: nextResetDate.getTime(),
    });

    usage = await ctx.db.get(usage._id);
  }

  return usage;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();

    // Return existing usage or default values
    if (usage) {
      return usage;
    }

    // Return default usage structure if none exists
    return {
      _id: null as any,
      _creationTime: Date.now(),
      userId,
      plan: "free" as const,
      messagesUsed: 0,
      searchesUsed: 0,
      resetDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    };
  },
});

export const getLimits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return PLAN_LIMITS.free;
    }

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();

    const plan = usage?.plan || "free";
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  },
});

export const incrementMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const usage = await ensureUsageRecord(ctx, userId);
    if (!usage) {
      throw new Error("Failed to create usage record");
    }

    await ctx.db.patch(usage._id, {
      messagesUsed: usage.messagesUsed + 1,
    });
  },
});

export const incrementSearches = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const usage = await ensureUsageRecord(ctx, userId);
    if (!usage) {
      throw new Error("Failed to create usage record");
    }

    const limits = PLAN_LIMITS[usage.plan as keyof typeof PLAN_LIMITS];
    if (usage.searchesUsed >= limits.searches) {
      throw new Error(`Monthly search limit reached (${limits.searches}). Upgrade your plan for more searches.`);
    }

    await ctx.db.patch(usage._id, {
      searchesUsed: usage.searchesUsed + 1,
    });
  },
});

export const upgradePlan = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("ultra")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const usage = await ensureUsageRecord(ctx, userId);
    if (!usage) {
      throw new Error("Failed to create usage record");
    }

    await ctx.db.patch(usage._id, {
      plan: args.plan,
    });
  },
});
