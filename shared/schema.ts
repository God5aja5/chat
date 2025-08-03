import { relations, sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: varchar("model").notNull().default("gpt-4o"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  tokens: integer("tokens"),
  isEdited: boolean("is_edited").default(false),
});

// File uploads
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// User settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: varchar("theme").default("auto"), // "light" | "dark" | "auto"
  defaultModel: varchar("default_model").default("gpt-4o"),
  temperature: integer("temperature").default(70), // 0-100
  maxTokens: integer("max_tokens").default(2048),
  streamingEnabled: boolean("streaming_enabled").default(true),
  codeRenderingEnabled: boolean("code_rendering_enabled").default(true),
  markdownEnabled: boolean("markdown_enabled").default(true),
  preventCodeOverwrites: boolean("prevent_code_overwrites").default(true),
  showLineAnnotations: boolean("show_line_annotations").default(false),
  showDiffViewer: boolean("show_diff_viewer").default(true),
  openaiApiKey: text("openai_api_key"), // encrypted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artifacts (code generations, files, etc.)
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  type: varchar("type").notNull(), // "code" | "document" | "image"
  language: varchar("language"), // for code artifacts
  linkedArtifactId: varchar("linked_artifact_id"), // for versions
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  chats: many(chats),
  settings: one(userSettings),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  files: many(files),
  artifacts: many(artifacts),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  files: many(files),
  artifacts: many(artifacts),
}));

export const filesRelations = relations(files, ({ one }) => ({
  chat: one(chats, {
    fields: [files.chatId],
    references: [chats.id],
  }),
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  chat: one(chats, {
    fields: [artifacts.chatId],
    references: [chats.id],
  }),
  message: one(messages, {
    fields: [artifacts.messageId],
    references: [messages.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  title: true,
  model: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  role: true,
  content: true,
  tokens: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  chatId: true,
  messageId: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  filePath: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtifactSchema = createInsertSchema(artifacts).pick({
  chatId: true,
  messageId: true,
  fileName: true,
  content: true,
  version: true,
  type: true,
  language: true,
  linkedArtifactId: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id: string };
export type User = typeof users.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type Artifact = typeof artifacts.$inferSelect;

// Extended types with relations
export type ChatWithMessages = Chat & {
  messages: Message[];
  files: File[];
  artifacts: Artifact[];
};

export type MessageWithFiles = Message & {
  files: File[];
  artifacts: Artifact[];
};

export type UserWithSettings = User & {
  settings?: UserSettings;
};
