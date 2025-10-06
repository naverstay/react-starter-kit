/**
 * Data loaders. Usage example:
 *
 * ```ts
 * protectedProcedure
 *   .query(async ({ ctx }) => {
 *     const user = await userById(ctx).load(ctx.session.userId);
 *     ...
 *   })
 * ```
 */

/* SPDX-FileCopyrightText: 2014-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import DataLoader from "dataloader";
import { inArray, eq, or } from "drizzle-orm";
import { user } from "@repo/db/schema/user.js";
import { product } from "@repo/db/schema/product.js";
import type { TRPCContext } from "./context";

// The list of data loader keys to be used with the context cache
// to avoid creating multiple instances of the same data loader.
export const USER_BY_ID = Symbol("userById");
export const USER_BY_EMAIL = Symbol("userByEmail");
export const PRODUCT_BY_ID = Symbol("productById");

function createKeyMap<T, K extends keyof T>(items: T[], keyField: K): Map<T[K], T> {
  return new Map(items.map((item) => [item[keyField], item]));
}

export function userById(ctx: TRPCContext) {
  if (!ctx.cache.has(USER_BY_ID)) {
    const loader = new DataLoader(async (userIds: readonly string[]) => {
      if (userIds.length === 0) return [];

      const users = await ctx.db
        .select()
        .from(user)
        .where(inArray(user.id, [...userIds]));
      const userMap = createKeyMap(users, "id");
      return userIds.map((id) => userMap.get(id) || null);
    });
    ctx.cache.set(USER_BY_ID, loader);
  }
  return ctx.cache.get(USER_BY_ID) as DataLoader<string, typeof user.$inferSelect | null>;
}

export function userByEmail(ctx: TRPCContext) {
  if (!ctx.cache.has(USER_BY_EMAIL)) {
    const loader = new DataLoader(async (emails: readonly string[]) => {
      if (emails.length === 0) return [];

      const users = await ctx.db
        .select()
        .from(user)
        .where(inArray(user.email, [...emails]));
      const userMap = createKeyMap(users, "email");
      return emails.map((email) => userMap.get(email) || null);
    });
    ctx.cache.set(USER_BY_EMAIL, loader);
  }
  return ctx.cache.get(USER_BY_EMAIL) as DataLoader<string, typeof user.$inferSelect | null>;
}

export function productById(ctx: TRPCContext) {
  if (!ctx.cache.has(PRODUCT_BY_ID)) {
    const loader = new DataLoader(async (productIds: readonly string[]) => {
      if (productIds.length === 0) return [];

      const products = await ctx.db
        .select()
        .from(product)
        .where(inArray(product.id, [...productIds]));

      const productMap = createKeyMap(products, "id");
      return productIds.map((id) => productMap.get(id) || null);
    });

    ctx.cache.set(PRODUCT_BY_ID, loader);
  }

  return ctx.cache.get(PRODUCT_BY_ID) as DataLoader<string, typeof product.$inferSelect | null>;
}

export async function addProduct(
  ctx: TRPCContext,
  {
    name_de,
    name_en,
    name_ru,
    imageUrl,
    gi,
    gl,
  }: {
    name_de: string;
    name_en?: string;
    name_ru?: string;
    imageUrl?: string;
    gi: number;
    gl: number;
  },
) {
  const existing = await ctx.db
    .select()
    .from(product)
    .where(or(eq(product.name_de, name_de), eq(product.name_en, name_en ?? ""), eq(product.name_ru, name_ru ?? "")))
    .limit(1);

  if (existing.length > 0) {
    console.log(`⚠️ Продукт "${name_de}" уже существует, добавление пропущено.`);
    return existing[0];
  }

  const inserted = await ctx.db
    .insert(product)
    .values({
      name_de,
      name_en,
      name_ru,
      imageUrl,
      gi,
      gl,
    })
    .returning();

  const newProduct = inserted[0];

  console.log(`✅ Добавлен продукт "${name_de}"`);

  // Инвалидируем кэш productById
  if (ctx.cache.has(PRODUCT_BY_ID)) {
    const loader = ctx.cache.get(PRODUCT_BY_ID) as DataLoader<string, typeof product.$inferSelect | null>;
    loader.clear(newProduct.id).prime(newProduct.id, newProduct);
  }

  return newProduct;
}
