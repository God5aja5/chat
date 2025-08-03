import {
  users,
  chats,
  messages,
  files,
  userSettings,
  artifacts,
  plans,
  subscriptions,
  redeemCodes,
  contactMessages,
  usageTracking,
  adminUsers,
  modelCapabilities,
  databaseBackups,

  type User,
  type UpsertUser,
  type InsertChat,
  type Chat,
  type InsertMessage,
  type Message,
  type InsertFile,
  type File,
  type InsertUserSettings,
  type UserSettings,
  type InsertArtifact,
  type Artifact,
  type Plan,
  type InsertPlan,
  type Subscription,
  type InsertSubscription,
  type RedeemCode,
  type InsertRedeemCode,
  type ContactMessage,
  type InsertContactMessage,
  type UsageTracking,
  type InsertUsageTracking,
  type AdminUser,
  type InsertAdminUser,
  type ModelCapability,
  type InsertModelCapability,
  type DatabaseBackup,
  type InsertDatabaseBackup,

  type ChatWithMessages,
  type MessageWithFiles,
  type UserWithSettings,
  type SubscriptionWithPlan,
  type RedeemCodeWithPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Chat operations
  getUserChats(userId: string): Promise<Chat[]>;
  getChat(chatId: string): Promise<ChatWithMessages | undefined>;
  createChat(userId: string, data: InsertChat): Promise<Chat>;
  updateChat(chatId: string, data: Partial<InsertChat>): Promise<Chat>;
  deleteChat(chatId: string): Promise<void>;
  deleteUserChats(userId: string): Promise<void>;
  
  // Message operations
  getChatMessages(chatId: string): Promise<MessageWithFiles[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  updateMessage(messageId: string, data: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  
  // File operations
  createFile(data: InsertFile): Promise<File>;
  getMessageFiles(messageId: string): Promise<File[]>;
  deleteFile(fileId: string): Promise<void>;
  
  // Artifact operations
  getChatArtifacts(chatId: string): Promise<Artifact[]>;
  getUserArtifacts(userId: string): Promise<Artifact[]>;
  createArtifact(data: InsertArtifact): Promise<Artifact>;
  updateArtifact(artifactId: string, data: Partial<InsertArtifact>): Promise<Artifact>;
  deleteArtifact(artifactId: string): Promise<void>;
  deleteUserArtifacts(userId: string): Promise<void>;
  
  // Premium plan operations
  getPlans(): Promise<Plan[]>;
  createPlan(data: InsertPlan): Promise<Plan>;
  updatePlan(planId: string, data: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(planId: string): Promise<void>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<SubscriptionWithPlan | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(subscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription>;
  expireSubscription(subscriptionId: string): Promise<void>;
  getActiveSubscriptions(): Promise<SubscriptionWithPlan[]>;
  
  // Redeem code operations
  getRedeemCode(code: string): Promise<RedeemCodeWithPlan | undefined>;
  createRedeemCode(data: InsertRedeemCode): Promise<RedeemCode>;
  useRedeemCode(code: string, userId: string): Promise<RedeemCode>;
  getUnusedRedeemCodes(): Promise<RedeemCodeWithPlan[]>;
  deleteRedeemCode(codeId: string): Promise<void>;
  
  // Contact message operations
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(data: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(messageId: string, data: { status?: string, adminReply?: string }): Promise<ContactMessage>;
  deleteContactMessage(messageId: string): Promise<void>;
  
  // Usage tracking operations
  recordUsage(data: InsertUsageTracking): Promise<UsageTracking>;
  getUserUsage(userId: string, type?: string, startDate?: Date): Promise<UsageTracking[]>;
  getUserDailyUsage(userId: string, date?: Date): Promise<{ chat: number, image: number, token: number }>;
  
  // Admin operations
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  createAdminUser(data: InsertAdminUser): Promise<AdminUser>;
  updateAdminLastLogin(username: string): Promise<void>;
  
  // Model capabilities operations
  getModelCapabilities(): Promise<ModelCapability[]>;
  getModelCapability(modelName: string): Promise<ModelCapability | undefined>;
  createModelCapability(data: InsertModelCapability): Promise<ModelCapability>;
  updateModelCapability(modelName: string, data: Partial<InsertModelCapability>): Promise<ModelCapability>;
  
  // Database backup operations
  createDatabaseBackup(data: InsertDatabaseBackup): Promise<DatabaseBackup>;
  getDatabaseBackups(): Promise<DatabaseBackup[]>;
  deleteDatabaseBackup(id: string): Promise<void>;
  
  // Data management
  deleteUserData(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [result] = await db
      .insert(userSettings)
      .values({ ...settings, userId })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
  
  // Chat operations
  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async getChat(chatId: string): Promise<ChatWithMessages | undefined> {
    // Get chat
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) return undefined;

    // Get messages with files
    const chatMessages = await this.getChatMessages(chatId);
    
    // Get files
    const chatFiles = await db
      .select()
      .from(files)
      .where(eq(files.chatId, chatId));
    
    // Get artifacts
    const chatArtifacts = await this.getChatArtifacts(chatId);

    return {
      ...chat,
      messages: chatMessages,
      files: chatFiles,
      artifacts: chatArtifacts,
    };
  }

  async createChat(userId: string, data: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values({ ...data, userId })
      .returning();
    return chat;
  }

  async updateChat(chatId: string, data: Partial<InsertChat>): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chats.id, chatId))
      .returning();
    return chat;
  }

  async deleteChat(chatId: string): Promise<void> {
    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async deleteUserChats(userId: string): Promise<void> {
    await db.delete(chats).where(eq(chats.userId, userId));
  }
  
  // Message operations
  async getChatMessages(chatId: string): Promise<MessageWithFiles[]> {
    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp);

    // Get files for each message
    const messagesWithFiles = await Promise.all(
      messagesData.map(async (message) => {
        const messageFiles = await this.getMessageFiles(message.id);
        const messageArtifacts = await db
          .select()
          .from(artifacts)
          .where(eq(artifacts.messageId, message.id));
        
        return {
          ...message,
          files: messageFiles,
          artifacts: messageArtifacts,
        };
      })
    );

    return messagesWithFiles;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(data)
      .returning();
    return message;
  }

  async updateMessage(messageId: string, data: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ ...data, isEdited: true })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, messageId));
  }
  
  // File operations
  async createFile(data: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(data)
      .returning();
    return file;
  }

  async getMessageFiles(messageId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.messageId, messageId));
  }

  async deleteFile(fileId: string): Promise<void> {
    await db.delete(files).where(eq(files.id, fileId));
  }
  
  // Artifact operations
  async getChatArtifacts(chatId: string): Promise<Artifact[]> {
    return await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.chatId, chatId))
      .orderBy(desc(artifacts.createdAt));
  }

  async getUserArtifacts(userId: string): Promise<Artifact[]> {
    return await db
      .select({
        id: artifacts.id,
        chatId: artifacts.chatId,
        messageId: artifacts.messageId,
        fileName: artifacts.fileName,
        content: artifacts.content,
        version: artifacts.version,
        type: artifacts.type,
        language: artifacts.language,
        linkedArtifactId: artifacts.linkedArtifactId,
        createdAt: artifacts.createdAt,
      })
      .from(artifacts)
      .innerJoin(chats, eq(artifacts.chatId, chats.id))
      .where(eq(chats.userId, userId))
      .orderBy(desc(artifacts.createdAt));
  }

  async createArtifact(data: InsertArtifact): Promise<Artifact> {
    const [artifact] = await db
      .insert(artifacts)
      .values(data)
      .returning();
    return artifact;
  }

  async updateArtifact(artifactId: string, data: Partial<InsertArtifact>): Promise<Artifact> {
    const [artifact] = await db
      .update(artifacts)
      .set(data)
      .where(eq(artifacts.id, artifactId))
      .returning();
    return artifact;
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    await db.delete(artifacts).where(eq(artifacts.id, artifactId));
  }

  async deleteUserArtifacts(userId: string): Promise<void> {
    await db
      .delete(artifacts)
      .where(
        sql`${artifacts.chatId} IN (SELECT id FROM ${chats} WHERE user_id = ${userId})`
      );
  }
  
  // Premium plan operations
  async getPlans(): Promise<Plan[]> {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.price);
  }

  async createPlan(data: InsertPlan): Promise<Plan> {
    const [plan] = await db
      .insert(plans)
      .values(data)
      .returning();
    return plan;
  }

  async updatePlan(planId: string, data: Partial<InsertPlan>): Promise<Plan> {
    const [plan] = await db
      .update(plans)
      .set(data)
      .where(eq(plans.id, planId))
      .returning();
    return plan;
  }

  async deletePlan(planId: string): Promise<void> {
    await db.delete(plans).where(eq(plans.id, planId));
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<SubscriptionWithPlan | undefined> {
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        expiresAt: subscriptions.expiresAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        sql`${subscriptions.expiresAt} > NOW()`
      ))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    
    return subscription as SubscriptionWithPlan;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    return subscription;
  }

  async updateSubscription(subscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    return subscription;
  }

  async expireSubscription(subscriptionId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId));
  }

  async getActiveSubscriptions(): Promise<SubscriptionWithPlan[]> {
    return await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        expiresAt: subscriptions.expiresAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        plan: plans,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(and(
        eq(subscriptions.status, "active"),
        sql`${subscriptions.expiresAt} > NOW()`
      ))
      .orderBy(desc(subscriptions.createdAt)) as SubscriptionWithPlan[];
  }

  // Redeem code operations
  async getRedeemCode(code: string): Promise<RedeemCodeWithPlan | undefined> {
    const [redeemCode] = await db
      .select({
        id: redeemCodes.id,
        code: redeemCodes.code,
        planId: redeemCodes.planId,
        duration: redeemCodes.duration,
        isUsed: redeemCodes.isUsed,
        usedBy: redeemCodes.usedBy,
        usedAt: redeemCodes.usedAt,
        createdAt: redeemCodes.createdAt,
        expiresAt: redeemCodes.expiresAt,
        plan: plans,
      })
      .from(redeemCodes)
      .innerJoin(plans, eq(redeemCodes.planId, plans.id))
      .where(eq(redeemCodes.code, code));
    
    return redeemCode as RedeemCodeWithPlan;
  }

  async createRedeemCode(data: InsertRedeemCode): Promise<RedeemCode> {
    const [redeemCode] = await db
      .insert(redeemCodes)
      .values(data)
      .returning();
    return redeemCode;
  }

  async useRedeemCode(code: string, userId: string): Promise<RedeemCode> {
    const [redeemCode] = await db
      .update(redeemCodes)
      .set({ 
        isUsed: true, 
        usedBy: userId, 
        usedAt: new Date() 
      })
      .where(eq(redeemCodes.code, code))
      .returning();
    return redeemCode;
  }

  async getUnusedRedeemCodes(): Promise<RedeemCodeWithPlan[]> {
    return await db
      .select({
        id: redeemCodes.id,
        code: redeemCodes.code,
        planId: redeemCodes.planId,
        duration: redeemCodes.duration,
        isUsed: redeemCodes.isUsed,
        usedBy: redeemCodes.usedBy,
        usedAt: redeemCodes.usedAt,
        createdAt: redeemCodes.createdAt,
        expiresAt: redeemCodes.expiresAt,
        plan: plans,
      })
      .from(redeemCodes)
      .innerJoin(plans, eq(redeemCodes.planId, plans.id))
      .where(eq(redeemCodes.isUsed, false))
      .orderBy(desc(redeemCodes.createdAt)) as RedeemCodeWithPlan[];
  }

  async deleteRedeemCode(codeId: string): Promise<void> {
    await db.delete(redeemCodes).where(eq(redeemCodes.id, codeId));
  }

  // Contact message operations
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(data: InsertContactMessage): Promise<ContactMessage> {
    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const [contactMessage] = await db
      .insert(contactMessages)
      .values({
        ...data,
        ticketNumber,
      })
      .returning();
    return contactMessage;
  }

  async updateContactMessage(messageId: string, data: { status?: string, adminReply?: string }): Promise<ContactMessage> {
    const updateData: any = { ...data };
    if (data.adminReply) {
      updateData.repliedAt = new Date();
      updateData.status = "replied";
    }
    
    const [contactMessage] = await db
      .update(contactMessages)
      .set(updateData)
      .where(eq(contactMessages.id, messageId))
      .returning();
    return contactMessage;
  }

  async deleteContactMessage(messageId: string): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));
  }

  async getContactMessageByTicket(ticketNumber: string): Promise<ContactMessage | undefined> {
    const [message] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.ticketNumber, ticketNumber));
    return message;
  }

  async getUserContactMessages(email: string): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.email, email))
      .orderBy(desc(contactMessages.createdAt));
  }

  // Usage tracking operations
  async recordUsage(data: InsertUsageTracking): Promise<UsageTracking> {
    const [usage] = await db
      .insert(usageTracking)
      .values(data)
      .returning();
    return usage;
  }

  async getUserUsage(userId: string, type?: string, startDate?: Date): Promise<UsageTracking[]> {
    const conditions = [eq(usageTracking.userId, userId)];
    
    if (type) {
      conditions.push(eq(usageTracking.type, type));
    }

    if (startDate) {
      conditions.push(sql`${usageTracking.date} >= ${startDate}`);
    }

    return await db
      .select()
      .from(usageTracking)
      .where(and(...conditions))
      .orderBy(desc(usageTracking.date));
  }

  async getUserDailyUsage(userId: string, date?: Date): Promise<{ chat: number, image: number, token: number }> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const usage = await db
      .select({
        type: usageTracking.type,
        totalCount: sql<number>`SUM(${usageTracking.count})`,
      })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          sql`${usageTracking.date} >= ${startOfDay}`,
          sql`${usageTracking.date} <= ${endOfDay}`
        )
      )
      .groupBy(usageTracking.type);

    const result = { chat: 0, image: 0, token: 0 };
    usage.forEach(row => {
      if (row.type === "chat") result.chat = row.totalCount;
      if (row.type === "image") result.image = row.totalCount;
      if (row.type === "token") result.token = row.totalCount;
    });

    return result;
  }

  // Admin operations
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    return admin;
  }

  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(data)
      .returning();
    return admin;
  }

  async updateAdminLastLogin(username: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.username, username));
  }

  // Model capabilities operations
  async getModelCapabilities(): Promise<ModelCapability[]> {
    return await db
      .select()
      .from(modelCapabilities)
      .where(eq(modelCapabilities.isActive, true))
      .orderBy(modelCapabilities.modelName);
  }

  async getModelCapability(modelName: string): Promise<ModelCapability | undefined> {
    const [capability] = await db
      .select()
      .from(modelCapabilities)
      .where(eq(modelCapabilities.modelName, modelName));
    return capability;
  }

  async createModelCapability(data: InsertModelCapability): Promise<ModelCapability> {
    const [capability] = await db
      .insert(modelCapabilities)
      .values(data)
      .returning();
    return capability;
  }

  async updateModelCapability(modelName: string, data: Partial<InsertModelCapability>): Promise<ModelCapability> {
    const [capability] = await db
      .update(modelCapabilities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(modelCapabilities.modelName, modelName))
      .returning();
    return capability;
  }

  // Database backup operations
  async createDatabaseBackup(data: InsertDatabaseBackup): Promise<DatabaseBackup> {
    const [backup] = await db
      .insert(databaseBackups)
      .values(data)
      .returning();
    return backup;
  }

  async getDatabaseBackups(): Promise<DatabaseBackup[]> {
    return await db
      .select()
      .from(databaseBackups)
      .orderBy(desc(databaseBackups.createdAt));
  }

  async deleteDatabaseBackup(id: string): Promise<void> {
    await db.delete(databaseBackups).where(eq(databaseBackups.id, id));
  }

  // Data management
  async deleteUserData(userId: string): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await this.deleteUserArtifacts(userId);
    await this.deleteUserChats(userId);
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    await db.delete(usageTracking).where(eq(usageTracking.userId, userId));
    // Note: We don't delete the user record itself as it's managed by auth
  }

  // Enhanced redeem code generation with flexible duration
  async generateRedeemCodes(planName: string, duration: number, durationType: 'months' | 'years', count: number): Promise<RedeemCode[]> {
    const plan = await this.getPlanByName(planName);
    if (!plan) {
      throw new Error(`Plan ${planName} not found`);
    }

    const codes: InsertRedeemCode[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode();
      codes.push({
        code,
        planId: plan.id,
        duration: durationType === 'years' ? duration * 12 : duration, // Convert years to months
        durationType,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
    }

    return await db.insert(redeemCodes).values(codes).returning();
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i > 0 && (i + 1) % 4 === 0 && i < 15) {
        result += '-';
      }
    }
    return result;
  }

  private async getPlanByName(name: string): Promise<Plan | undefined> {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, name));
    return plan;
  }

  // Additional helper methods for admin panel
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).limit(100);
  }

  async getAllChats(): Promise<Chat[]> {
    return await db.select().from(chats).limit(100);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).limit(100);
  }

  async getAllRedeemCodes(): Promise<RedeemCode[]> {
    return await db.select().from(redeemCodes).limit(100);
  }

  async getAllSupportTickets(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).limit(100);
  }

  // Enhanced redeem code generation
  async generateRedeemCodes(planName: string, duration: number, durationType: string, count: number = 1): Promise<RedeemCode[]> {
    const plan = await this.getPlanByName(planName);
    if (!plan) {
      throw new Error(`Plan "${planName}" not found`);
    }

    const codes: RedeemCode[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode();
      const durationInDays = durationType === 'months' ? duration * 30 : duration * 365;
      
      const [newCode] = await db
        .insert(redeemCodes)
        .values({
          code,
          planId: plan.id,
          duration: durationInDays,
          isUsed: false,
        })
        .returning();
      
      codes.push(newCode);
    }
    
    return codes;
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async getPlanByName(name: string): Promise<Plan | undefined> {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, name));
    return plan;
  }
}

export const storage = new DatabaseStorage();
