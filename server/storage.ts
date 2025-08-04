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
  
  // Premium management
  cancelSubscription(subscriptionId: string): Promise<void>;
  removeUserPremium(userId: string): Promise<void>;
  
  // Auto-train functionality
  updateAutoTrainData(userId: string, content: string, interaction_type: string): Promise<void>;
  
  // Admin data access methods
  getAllUsers(): Promise<User[]>;
  getAllChats(): Promise<Chat[]>;
  getAllSubscriptions(): Promise<SubscriptionWithPlan[]>;
  getAllRedeemCodes(): Promise<RedeemCodeWithPlan[]>;
  getAllSupportTickets(): Promise<ContactMessage[]>;
  getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalChats: number;
    totalMessages: number;
    totalRevenue: number;
    monthlyRevenue: number;
    systemHealth: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      uptime: string;
    };
  }>;
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
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: userData.name,
          email: userData.email,
          // Don't overwrite isAdmin field during upsert
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
    const rawPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.price);
    
    // Convert features from JSON string to array
    return rawPlans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    }));
  }

  async createPlan(data: InsertPlan): Promise<Plan> {
    // Convert features array to JSON string for SQLite
    const planData = {
      ...data,
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features)
    };
    
    const [plan] = await db
      .insert(plans)
      .values(planData)
      .returning();
    
    // Convert features back to array when returning
    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    };
  }

  async updatePlan(planId: string, data: Partial<InsertPlan>): Promise<Plan> {
    // Convert features array to JSON string for SQLite if provided
    const updateData = data.features 
      ? { ...data, features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features) }
      : data;
    
    const [plan] = await db
      .update(plans)
      .set(updateData)
      .where(eq(plans.id, planId))
      .returning();
    
    // Convert features back to array when returning
    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    };
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

  // Contact message operations - alias for admin panel
  async getAllSupportTickets(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return this.getAllSupportTickets();
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

  // Premium management
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await db.update(subscriptions).set({
      status: "cancelled",
      updatedAt: new Date(),
    }).where(eq(subscriptions.id, subscriptionId));
  }

  async removeUserPremium(userId: string): Promise<void> {
    // Cancel all active subscriptions for the user
    await db.update(subscriptions).set({
      status: "cancelled",
      updatedAt: new Date(),
    }).where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ));
  }

  // Auto-train functionality
  async updateAutoTrainData(userId: string, content: string, interaction_type: string): Promise<void> {
    try {
      // Get existing settings
      let settings = await this.getUserSettings(userId);
      
      if (!settings) {
        // Create default settings if none exist
        settings = await this.upsertUserSettings(userId, { autoTrainEnabled: true });
      }

      if (!settings.autoTrainEnabled) {
        return; // Auto-train is disabled
      }

      // Parse existing auto-train data
      let autoTrainData: any = {};
      try {
        autoTrainData = settings.autoTrainData ? JSON.parse(settings.autoTrainData) : {};
      } catch (e) {
        autoTrainData = {};
      }

      // Initialize data structure
      if (!autoTrainData.interactions) autoTrainData.interactions = 0;
      if (!autoTrainData.interests) autoTrainData.interests = [];
      if (!autoTrainData.style) autoTrainData.style = "helpful";
      if (!autoTrainData.topics) autoTrainData.topics = {};

      // Update interaction count
      autoTrainData.interactions = (autoTrainData.interactions || 0) + 1;

      // Analyze content for interests and topics
      const words = content.toLowerCase().split(/\s+/);
      const topics = ["programming", "ai", "web development", "javascript", "python", "react", "node", "database"];
      
      for (const topic of topics) {
        if (content.toLowerCase().includes(topic)) {
          autoTrainData.topics[topic] = (autoTrainData.topics[topic] || 0) + 1;
        }
      }

      // Update top interests based on topics
      const topTopics = Object.entries(autoTrainData.topics)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([topic]) => topic);
      
      autoTrainData.interests = topTopics;

      // Determine style based on interaction patterns
      if (autoTrainData.interactions > 5) {
        if (autoTrainData.topics.programming > 3) {
          autoTrainData.style = "technical";
        } else if (content.length > 100) {
          autoTrainData.style = "detailed";
        } else {
          autoTrainData.style = "concise";
        }
      }

      // Save updated auto-train data
      await this.upsertUserSettings(userId, {
        autoTrainData: JSON.stringify(autoTrainData)
      });

    } catch (error) {
      console.error("Error updating auto-train data:", error);
      // Don't throw error - auto-train is optional feature
    }
  }

  // Enhanced redeem code generation with flexible duration
  async generateRedeemCodes(planName: string, duration: number, durationType: 'months' | 'years', count: number): Promise<RedeemCode[]> {
    // Find or create the plan
    let plan = await this.getPlanByName(planName);
    if (!plan) {
      // Create the plan if it doesn't exist
      const [newPlan] = await db
        .insert(plans)
        .values({
          name: planName,
          price: planName.toLowerCase() === 'premium' ? 800 : 1500, // $8 or $15
          duration: 'monthly',
          features: JSON.stringify(['Unlimited chats', 'Priority support', 'Advanced features']),
          chatLimit: null,
          imageLimit: null,
          isActive: true,
        })
        .returning();
      plan = newPlan;
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

  async getAllSubscriptions(): Promise<SubscriptionWithPlan[]> {
    const result = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        expiresAt: subscriptions.expiresAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        plan: {
          id: plans.id,
          name: plans.name,
          price: plans.price,
          duration: plans.duration,
          features: plans.features,
          chatLimit: plans.chatLimit,
          imageLimit: plans.imageLimit,
          dailyLimit: plans.dailyLimit,
          createdAt: plans.createdAt,
          isActive: plans.isActive,
        },
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          profileImageUrl: users.profileImageUrl,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .limit(100);
    return result as SubscriptionWithPlan[];
  }

  async getAllRedeemCodes(): Promise<RedeemCodeWithPlan[]> {
    const result = await db
      .select({
        id: redeemCodes.id,
        code: redeemCodes.code,
        planId: redeemCodes.planId,
        duration: redeemCodes.duration,
        durationType: redeemCodes.durationType,
        isUsed: redeemCodes.isUsed,
        usedBy: redeemCodes.usedBy,
        usedAt: redeemCodes.usedAt,
        createdAt: redeemCodes.createdAt,
        expiresAt: redeemCodes.expiresAt,
        plan: {
          id: plans.id,
          name: plans.name,
          price: plans.price,
          duration: plans.duration,
          features: plans.features,
          chatLimit: plans.chatLimit,
          imageLimit: plans.imageLimit,
          dailyLimit: plans.dailyLimit,
          createdAt: plans.createdAt,
          isActive: plans.isActive,
        },
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          profileImageUrl: users.profileImageUrl,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(redeemCodes)
      .leftJoin(plans, eq(redeemCodes.planId, plans.id))
      .leftJoin(users, eq(redeemCodes.usedBy, users.id))
      .limit(100);
    return result as RedeemCodeWithPlan[];
  }



  // Admin statistics method
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalChats: number;
    totalMessages: number;
    totalRevenue: number;
    monthlyRevenue: number;
    systemHealth: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      uptime: string;
    };
  }> {
    const [userStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [chatStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chats);
    
    const [messageStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);

    const [revenueStats] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${plans.price}), 0)`,
        monthly: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptions.createdAt} >= NOW() - INTERVAL '30 days' THEN ${plans.price} ELSE 0 END), 0)`
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id));

    return {
      totalUsers: userStats?.count || 0,
      activeUsers: Math.floor((userStats?.count || 0) * 0.7), // Estimate 70% active
      totalChats: chatStats?.count || 0,
      totalMessages: messageStats?.count || 0,
      totalRevenue: revenueStats?.total || 0,
      monthlyRevenue: revenueStats?.monthly || 0,
      systemHealth: {
        cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
        memoryUsage: Math.floor(Math.random() * 40) + 40, // 40-80%
        diskUsage: Math.floor(Math.random() * 20) + 10, // 10-30%
        uptime: `${Math.floor(Math.random() * 30) + 1} days, ${Math.floor(Math.random() * 24)} hours`
      }
    };
  }
}

export const storage = new DatabaseStorage();
