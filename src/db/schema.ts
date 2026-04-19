import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

// ─── Users ────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 20 }).unique(),
  fullname: varchar("fullname", { length: 25 }).notNull(),
  password: text("password").notNull(),
  salt: text("salt").notNull(),
  avatar: text("avatar"),
  gender: genderEnum("gender"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// ─── OAuth Clients ───────────────────────────────────────────

export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  clientId: varchar("client_id", { length: 32 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 64 }).notNull(),
  homepageUrl: text("homepage_url"),
  redirectUris: text("redirect_uris").notNull(), // Comma-separated list for simplicity in this demo
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// ─── Refresh Tokens ───────────────────────────────────────────

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  revoked: boolean("revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
