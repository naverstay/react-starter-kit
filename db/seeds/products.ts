/* SPDX-FileCopyrightText: 2014-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { readFileSync } from "fs";
import path from "path";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { schema as Db } from "../schema";

type ProductInsert = typeof Db.product.$inferInsert;

/**
 * Seeds the database with products loaded from gi.json
 */
export async function seedProducts(db: PostgresJsDatabase<typeof Db>) {
  console.log("Seeding products...");

  // Загружаем JSON из ./db/data/gi.json
  const filePath = path.resolve(__dirname, "../data/gi.json");
  const rawData = readFileSync(filePath, "utf-8");
  const products: ProductInsert[] = JSON.parse(rawData);

  for (const product of products) {
    await db.insert(Db.product).values(product).onConflictDoNothing();
  }

  console.log(`✅ Seeded ${products.length} products`);
}
