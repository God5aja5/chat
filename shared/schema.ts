import { relations, sql } from "drizzle-orm";
import {
  index,
  text,
  integer,
  real,
  sqliteTable,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire)
  })
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Chat conversations
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: text("model").notNull().default("gpt-4o"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Chat messages
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  timestamp: integer("timestamp").default(sql`(unixepoch())`),
  tokens: integer("tokens"),
  isEdited: integer("is_edited", { mode: "boolean" }).default(false),
});

// File uploads
export const files = sqliteTable("files", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: integer("uploaded_at").default(sql`(unixepoch())`),
});

// User settings
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: text("theme").default("auto"), // "light" | "dark" | "auto"
  defaultModel: text("default_model").default("gpt-4o"),
  defaultImageModel: text("default_image_model").default("dall-e-3"), // DALL-E model for images
  temperature: integer("temperature").default(70), // 0-100
  maxTokens: integer("max_tokens").default(2048),
  streamingEnabled: integer("streaming_enabled", { mode: "boolean" }).default(true),
  codeRenderingEnabled: integer("code_rendering_enabled", { mode: "boolean" }).default(true),
  markdownEnabled: integer("markdown_enabled", { mode: "boolean" }).default(true),
  preventCodeOverwrites: integer("prevent_code_overwrites", { mode: "boolean" }).default(true),
  showLineAnnotations: integer("show_line_annotations", { mode: "boolean" }).default(false),
  showDiffViewer: integer("show_diff_viewer", { mode: "boolean" }).default(true),
  openaiApiKey: text("openai_api_key"), // encrypted
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Artifacts (code generations, files, etc.)
export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  type: text("type").notNull(), // "code" | "document" | "image"
  language: text("language"), // for code artifacts
  linkedArtifactId: text("linked_artifact_id"), // for versions
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Premium Plans
export const plans = sqliteTable("plans", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in cents
  duration: text("duration").notNull(), // "monthly" | "yearly"
  features: text("features").notNull(), // JSON string array
  chatLimit: integer("chat_limit"), // null = unlimited
  imageLimit: integer("image_limit"), // null = unlimited
  dailyLimit: integer("daily_limit"), // for free plan
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// User Subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status").notNull().default("active"), // "active" | "expired" | "cancelled"
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Redeem Codes
export const redeemCodes = sqliteTable("redeem_codes", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  code: text("code").notNull().unique(),
  planId: text("plan_id").notNull().references(() => plans.id),
  duration: integer("duration").notNull(), // in months
  durationType: text("duration_type").notNull().default("months"), // "months" | "years"
  isUsed: integer("is_used", { mode: "boolean" }).default(false),
  usedBy: text("used_by").references(() => users.id),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  expiresAt: integer("expires_at"),
});

// Contact Messages
export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  ticketNumber: text("ticket_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull().default("general-inquiry"),
  priority: text("priority").default("medium"), // "low" | "medium" | "high" | "urgent"
  status: text("status").default("open"), // "open" | "in-progress" | "replied" | "closed"
  adminReply: text("admin_reply"),
  userId: text("user_id"), // Optional - for logged in users
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
  repliedAt: integer("replied_at"),
});

// Usage Tracking
export const usageTracking = sqliteTable("usage_tracking", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "chat" | "image" | "token"
  count: integer("count").notNull().default(1),
  date: integer("date").default(sql`(unixepoch())`),
});

// Admin Users
export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  role: text("role").default("admin"),
  lastLogin: integer("last_login"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Model Capabilities
export const modelCapabilities = sqliteTable("model_capabilities", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  modelName: text("model_name").notNull().unique(),
  displayName: text("display_name").notNull(),
  supportsText: integer("supports_text", { mode: "boolean" }).default(true),
  supportsImageInput: integer("supports_image_input", { mode: "boolean" }).default(false),
  supportsAudioInput: integer("supports_audio_input", { mode: "boolean" }).default(false),
  supportsImageOutput: integer("supports_image_output", { mode: "boolean" }).default(false),
  supportsAudioOutput: integer("supports_audio_output", { mode: "boolean" }).default(false),
  supportsWebSearch: integer("supports_web_search", { mode: "boolean" }).default(false),
  supportsFileUpload: integer("supports_file_upload", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Database Backups
export const databaseBackups = sqliteTable("database_backups", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  backupType: text("backup_type").notNull().default("full"), // "full" | "incremental"
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  chats: many(chats),
  settings: one(userSettings),
  subscriptions: many(subscriptions),
  usageTracking: many(usageTracking),
  redeemCodesUsed: many(redeemCodes),
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

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
  redeemCodes: many(redeemCodes),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const redeemCodesRelations = relations(redeemCodes, ({ one }) => ({
  plan: one(plans, {
    fields: [redeemCodes.planId],
    references: [plans.id],
  }),
  user: one(users, {
    fields: [redeemCodes.usedBy],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

export const modelCapabilitiesRelations = relations(modelCapabilities, ({ many }) => ({
  // No direct relations needed
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

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRedeemCodeSchema = createInsertSchema(redeemCodes).omit({
  id: true,
  isUsed: true,
  usedBy: true,
  usedAt: true,
  createdAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  status: true,
  adminReply: true,
  createdAt: true,
  repliedAt: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  date: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
});

export const insertModelCapabilitySchema = createInsertSchema(modelCapabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDatabaseBackupSchema = createInsertSchema(databaseBackups).omit({
  id: true,
  createdAt: true,
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
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertRedeemCode = z.infer<typeof insertRedeemCodeSchema>;
export type RedeemCode = typeof redeemCodes.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertModelCapability = z.infer<typeof insertModelCapabilitySchema>;
export type ModelCapability = typeof modelCapabilities.$inferSelect;
export type InsertDatabaseBackup = z.infer<typeof insertDatabaseBackupSchema>;
export type DatabaseBackup = typeof databaseBackups.$inferSelect;

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
  subscription?: Subscription & { plan: Plan };
};

export type PlanWithSubscriptions = Plan & {
  subscriptions: Subscription[];
};

export type SubscriptionWithPlan = Subscription & {
  plan: Plan;
  user: User;
};

export type RedeemCodeWithPlan = RedeemCode & {
  plan: Plan;
  user?: User;
};

export type ContactMessageWithStatus = ContactMessage;
