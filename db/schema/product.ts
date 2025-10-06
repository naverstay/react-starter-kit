import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .default(sql`uuid_generate_v7()`),

  name_de: text("name_de").notNull(),
  name_en: text("name_en"),
  name_ru: text("name_ru"),

  imageUrl: text("image_url"),

  gi: real("gi").notNull(),
  gl: real("gl").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const productRelations = relations(product, () => ({}));
