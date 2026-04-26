import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 20 }).unique(),
  fullname: varchar("fullname", { length: 25 }).notNull(),
  dateofbirth: date("date_of_birth").notNull(),
  password: text("password").notNull(),
  salt: text("salt").notNull(),
  gender: genderEnum("gender").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const oauthClientsTable = pgTable("oauth_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  appName: varchar("app_name", { length: 50 }).notNull(),
  clientId: text("client_id").unique().notNull(),
  clientSecret: text("client_secret").notNull(),
  websiteUrl: varchar("website_url", { length: 255 }).notNull(),
  redirectUris: text("redirect_uris").array().notNull(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => oauthClientsTable.id, { onDelete: "cascade" }),
  scopes: text("scopes").array().notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authCodesTable = pgTable("auth_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => oauthClientsTable.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  scopes: text("scopes").array().notNull(),
  used: boolean("used").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consentTable = pgTable("consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => oauthClientsTable.id, { onDelete: "cascade" }),
  scopes: text("scopes").array().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
