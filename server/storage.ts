import {
  users,
  chats,
  messages,
  files,
  userSettings,
  artifacts,
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
  type ChatWithMessages,
  type MessageWithFiles,
  type UserWithSettings,
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
  
  // Data management
  async deleteUserData(userId: string): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await this.deleteUserArtifacts(userId);
    await this.deleteUserChats(userId);
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    // Note: We don't delete the user record itself as it's managed by auth
  }
}

export const storage = new DatabaseStorage();
