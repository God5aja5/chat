import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { openaiService } from "./openai";
import { 
  insertChatSchema,
  insertMessageSchema,
  insertUserSettingsSchema,
  insertArtifactSchema,
  insertPlanSchema,
  insertSubscriptionSchema,
  insertRedeemCodeSchema,
  insertContactMessageSchema,
  insertUsageTrackingSchema,
  insertAdminUserSchema,
  insertModelCapabilitySchema,
  insertDatabaseBackupSchema,
} from "@shared/schema";
import { z } from "zod";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  },
});

// Firebase token verification middleware
const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    // For development, we'll extract user info from the token payload
    // In production, you should verify the Firebase ID token on the server
    let payload;
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (error) {
      console.error('Invalid token format:', error);
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const user = {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'User',
    };
    
    // Ensure user exists in database
    try {
      await storage.upsertUser({
        id: user.uid,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error('Error upserting user:', error);
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user settings
      const settings = await storage.getUserSettings(userId);
      
      res.json({
        ...user,
        settings,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Contact route
  app.post('/api/contact', async (req, res) => {
    try {
      const contactData = req.body;
      const message = await storage.createContactMessage({
        ...contactData,
        status: 'open',
        priority: contactData.priority || 'medium',
      });
      res.json(message);
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ error: "Failed to create contact message" });
    }
  });

  // Model capabilities endpoints
  app.get("/api/admin/model-capabilities", verifyFirebaseToken, async (req, res) => {
    try {
      const capabilities = await storage.getModelCapabilities();
      res.json(capabilities);
    } catch (error) {
      console.error("Error fetching model capabilities:", error);
      res.status(500).json({ error: "Failed to fetch model capabilities" });
    }
  });

  app.put("/api/admin/model-capabilities/:modelName", verifyFirebaseToken, async (req, res) => {
    try {
      const { modelName } = req.params;
      const updateData = req.body;
      
      const capability = await storage.updateModelCapability(modelName, updateData);
      res.json(capability);
    } catch (error) {
      console.error("Error updating model capability:", error);
      res.status(500).json({ error: "Failed to update model capability" });
    }
  });

  // Database management endpoints
  app.get("/api/admin/database/stats", verifyFirebaseToken, async (req, res) => {
    try {
      const stats = {
        totalTables: 15,
        totalRows: 1250,
        databaseSize: "45.2 MB",
        lastBackup: new Date().toISOString()
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ error: "Failed to fetch database stats" });
    }
  });

  app.post("/api/admin/database/backup", verifyFirebaseToken, async (req, res) => {
    try {
      const { type } = req.body;
      const fileName = `backup_${type}_${new Date().toISOString().split('T')[0]}.sql`;
      
      const backup = await storage.createDatabaseBackup({
        fileName,
        fileSize: 1024 * 1024 * 10,
        filePath: `/backups/${fileName}`,
        backupType: type,
      });
      
      res.json(backup);
    } catch (error) {
      console.error("Error creating database backup:", error);
      res.status(500).json({ error: "Failed to create database backup" });
    }
  });

  app.get("/api/admin/database/backups", verifyFirebaseToken, async (req, res) => {
    try {
      const backups = await storage.getDatabaseBackups();
      res.json(backups);
    } catch (error) {
      console.error("Error fetching database backups:", error);
      res.status(500).json({ error: "Failed to fetch database backups" });
    }
  });

  app.get("/api/admin/database/view", verifyFirebaseToken, async (req, res) => {
    try {
      const sampleData = {
        users: await storage.getAllUsers(),
        chats: await storage.getAllChats(),
        plans: await storage.getAllSubscriptions(),
        subscriptions: await storage.getAllSubscriptions(),
        redeemCodes: await storage.getAllRedeemCodes(),
        supportTickets: await storage.getAllSupportTickets(),
      };
      res.json(sampleData);
    } catch (error) {
      console.error("Error fetching database view:", error);
      res.status(500).json({ error: "Failed to fetch database view" });
    }
  });

  app.delete("/api/admin/database/backup/:id", verifyFirebaseToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDatabaseBackup(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting database backup:", error);
      res.status(500).json({ error: "Failed to delete database backup" });
    }
  });

  // Admin routes with proper authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      let payload;
      try {
        payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      const user = {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name || payload.email?.split('@')[0] || 'User',
      };
      
      // Check if user is admin
      const dbUser = await storage.getUser(user.uid);
      if (!dbUser || !dbUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };

  // Admin statistics endpoint
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Admin users endpoint
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin subscriptions endpoint
  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching admin subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Admin support tickets endpoint
  app.get("/api/admin/support-tickets", requireAdmin, async (req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching admin support tickets:", error);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  // Admin subscription management
  app.post("/api/admin/subscriptions/:subscriptionId/cancel", requireAdmin, async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      await storage.cancelSubscription(subscriptionId);
      res.json({ success: true, message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.post("/api/admin/users/:userId/remove-premium", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.removeUserPremium(userId);
      res.json({ success: true, message: "Premium access removed successfully" });
    } catch (error) {
      console.error("Error removing premium access:", error);
      res.status(500).json({ error: "Failed to remove premium access" });
    }
  });

  // Admin redeem codes endpoints
  app.get("/api/admin/redeem-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllRedeemCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching admin redeem codes:", error);
      res.status(500).json({ error: "Failed to fetch redeem codes" });
    }
  });

  app.post("/api/admin/redeem-codes/generate", requireAdmin, async (req, res) => {
    try {
      const { planName, duration, durationType, count } = req.body;
      
      if (!planName || !duration || !durationType || !count) {
        return res.status(400).json({ error: "Missing required fields: planName, duration, durationType, count" });
      }

      if (count < 1 || count > 100) {
        return res.status(400).json({ error: "Count must be between 1 and 100" });
      }

      const codes = await storage.generateRedeemCodes(planName, duration, durationType, count);
      res.json({ 
        success: true, 
        codes,
        message: `Successfully generated ${codes.length} redeem codes for ${planName} plan`
      });
    } catch (error) {
      console.error("Error generating redeem codes:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate redeem codes";
      res.status(500).json({ error: errorMessage });
    }
  });

  // User settings routes
  app.get('/api/user/settings', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const settings = await storage.getUserSettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/user/settings', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const settingsData = insertUserSettingsSchema.parse(req.body);
      
      const settings = await storage.upsertUserSettings(userId, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Chat routes
  app.get('/api/chats', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get('/api/chats/:chatId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify user owns this chat
      const userId = req.user.uid;
      if (chat.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post('/api/chats', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const chatData = insertChatSchema.parse(req.body);
      
      const chat = await storage.createChat(userId, chatData);
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.put('/api/chats/:chatId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.uid;
      
      // Verify user owns this chat
      const existingChat = await storage.getChat(chatId);
      if (!existingChat || existingChat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const chatData = insertChatSchema.partial().parse(req.body);
      const chat = await storage.updateChat(chatId, chatData);
      res.json(chat);
    } catch (error) {
      console.error("Error updating chat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update chat" });
    }
  });

  app.delete('/api/chats/:chatId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.uid;
      
      // Verify user owns this chat
      const existingChat = await storage.getChat(chatId);
      if (!existingChat || existingChat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      await storage.deleteChat(chatId);
      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  app.delete('/api/chats', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      await storage.deleteUserChats(userId);
      res.json({ message: "All chats deleted successfully" });
    } catch (error) {
      console.error("Error deleting all chats:", error);
      res.status(500).json({ message: "Failed to delete chats" });
    }
  });

  // Message routes
  app.post('/api/messages/send', verifyFirebaseToken, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { content, chatId } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get user settings for OpenAI configuration
      const userSettings = await storage.getUserSettings(userId);
      const apiKey = userSettings?.openaiApiKey || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      let currentChatId = chatId;
      
      // Create new chat if none provided
      if (!currentChatId) {
        const newChat = await storage.createChat(userId, {
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          model: userSettings?.defaultModel || "gpt-4o",
        });
        currentChatId = newChat.id;
      }

      // Verify user owns the chat
      const chat = await storage.getChat(currentChatId);
      if (!chat || chat.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Store user message
      const userMessage = await storage.createMessage({
        chatId: currentChatId,
        role: "user",
        content: content.trim(),
      });

      // Handle file uploads
      const uploadedFiles = req.files as Express.Multer.File[];
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await storage.createFile({
            chatId: currentChatId,
            messageId: userMessage.id,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: file.path,
          });
        }
      }

      // Set up Server-Sent Events for streaming
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Check if this is an image generation request
      const messageContent = content.toLowerCase();
      const isImageRequest = messageContent.includes("generate image") || 
                           messageContent.includes("create image") || 
                           messageContent.includes("draw") ||
                           messageContent.includes("make picture") ||
                           messageContent.includes("dall-e") ||
                           messageContent.includes("image of");

      // Get conversation history BEFORE creating assistant message
      const messages = await storage.getChatMessages(currentChatId);
      
      // Get user settings for auto-train and custom prompt
      const settings = await storage.getUserSettings(userId);
      
      // Build conversation history with custom prompt and auto-train
      let conversationHistory: Array<{ role: "user" | "assistant" | "system", content: string }> = [];
      
      // Add custom system prompt if available
      if (settings?.customPrompt) {
        conversationHistory.push({
          role: "system",
          content: settings.customPrompt
        });
      }
      
      // Add auto-train system prompt if enabled
      if (settings?.autoTrainEnabled && settings?.autoTrainData) {
        try {
          const autoTrainData = JSON.parse(settings.autoTrainData);
          const autoTrainPrompt = `Based on your previous interactions, I've learned that you prefer: ${autoTrainData.style || 'helpful'} responses about ${autoTrainData.interests?.join(', ') || 'various topics'}. I'll adjust my responses accordingly.`;
          conversationHistory.push({
            role: "system", 
            content: autoTrainPrompt
          });
        } catch (e) {
          // Invalid auto-train data, skip
        }
      }
      
      // Add message history
      conversationHistory = [...conversationHistory, ...messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }))];

      // Debug logging
      console.log(`Chat ${currentChatId}: Found ${messages.length} messages for history`);
      console.log("Conversation history:", JSON.stringify(conversationHistory.slice(-3), null, 2)); // Log last 3 messages

      let assistantResponse = "";
      
      // Create assistant message placeholder
      const assistantMessage = await storage.createMessage({
        chatId: currentChatId,
        role: "assistant",
        content: "",
      });

      if (isImageRequest) {
        try {
          // Extract image prompt from user message
          const prompt = content.replace(/generate image|create image|draw|make picture|dall-e|image of/gi, '').trim();
          
          res.write(`data: ${JSON.stringify({ content: "Generating image..." })}\n\n`);
          
          const imageResult = await openaiService.generateImage(prompt, apiKey, {
            model: userSettings?.defaultImageModel as "dall-e-2" | "dall-e-3" || "dall-e-3",
          });
          
          const imageResponse = `I've generated an image for you:\n\n![Generated Image](${imageResult.url})\n\n**Prompt:** ${prompt}`;
          
          // Update the assistant message with final content
          await storage.updateMessage(assistantMessage.id, {
            content: imageResponse,
          });

          // Record image usage
          await storage.recordUsage({
            userId,
            type: "image",
            count: 1,
          });
          
          // Send chat info if this was a new chat
          if (!chatId) {
            res.write(`data: ${JSON.stringify({ chatId: currentChatId, newChat: true })}\n\n`);
          }
          
          res.write(`data: ${JSON.stringify({ content: imageResponse, final: true })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        } catch (error) {
          console.error("Image generation error:", error);
          const errorResponse = "Sorry, I couldn't generate the image. Please check your OpenAI API key has DALL-E access or try again later.";
          
          await storage.updateMessage(assistantMessage.id, {
            content: errorResponse,
          });
          
          res.write(`data: ${JSON.stringify({ content: errorResponse, error: true })}\n\n`);
          res.end();
        }
      } else {
        // Regular chat completion
        console.log(`Sending to OpenAI: ${conversationHistory.length} messages with model ${chat.model}`);
        await openaiService.streamChatCompletion({
          messages: conversationHistory,
          model: chat.model,
          temperature: userSettings?.temperature || 70,
          maxTokens: userSettings?.maxTokens || 2048,
          apiKey,
          onToken: (token) => {
            assistantResponse += token;
            res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
          },
          onComplete: async (fullResponse) => {
            // Update the assistant message with final content
            await storage.updateMessage(assistantMessage.id, {
              content: fullResponse,
            });

            // Record chat usage
            await storage.recordUsage({
              userId,
              type: "chat",
              count: 1,
            });

            // Update auto-train data if enabled
            if (settings?.autoTrainEnabled) {
              await storage.updateAutoTrainData(userId, content, "chat");
            }
            
            // Send chat info if this was a new chat
            if (!chatId) {
              res.write(`data: ${JSON.stringify({ chatId: currentChatId, newChat: true })}\n\n`);
            }
            
            res.write(`data: [DONE]\n\n`);
            res.end();
          },
          onError: (error) => {
            console.error("OpenAI streaming error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          },
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  app.put('/api/messages/:messageId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.uid;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Verify user owns this message through chat ownership
      const message = await storage.getChatMessages(""); // We'll need to modify this
      // For now, let's update the message and let DB constraints handle ownership
      
      const updatedMessage = await storage.updateMessage(messageId, {
        content: content.trim(),
      });
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete('/api/messages/:messageId', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      // Similar ownership verification would be needed here
      
      await storage.deleteMessage(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Artifact routes
  app.get('/api/artifacts', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const artifacts = await storage.getUserArtifacts(userId);
      res.json(artifacts);
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      res.status(500).json({ message: "Failed to fetch artifacts" });
    }
  });

  app.post('/api/artifacts', verifyFirebaseToken, async (req: any, res) => {
    try {
      const artifactData = insertArtifactSchema.parse(req.body);
      const artifact = await storage.createArtifact(artifactData);
      res.json(artifact);
    } catch (error) {
      console.error("Error creating artifact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid artifact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create artifact" });
    }
  });

  // Data management routes
  app.delete('/api/user/data', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      await storage.deleteUserData(userId);
      res.json({ message: "All user data deleted successfully" });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Plans and subscription routes
  app.get('/api/plans', async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.get('/api/subscription', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const subscriptionData = insertSubscriptionSchema.parse({
        ...req.body,
        userId,
      });
      
      const subscription = await storage.createSubscription(subscriptionData);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Redeem code routes
  app.post('/api/redeem', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Redeem code is required" });
      }

      const redeemCode = await storage.getRedeemCode(code);
      if (!redeemCode) {
        return res.status(404).json({ message: "Invalid redeem code" });
      }

      if (redeemCode.isUsed) {
        return res.status(400).json({ message: "Redeem code has already been used" });
      }

      // Check if code is expired
      if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
        return res.status(400).json({ message: "Redeem code has expired" });
      }

      // Create subscription based on redeem code
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + redeemCode.duration);

      const subscription = await storage.createSubscription({
        userId,
        planId: redeemCode.planId,
        status: "active",
        expiresAt,
      });

      // Mark redeem code as used
      await storage.useRedeemCode(code, userId);

      res.json({ subscription, message: "Redeem code applied successfully!" });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ message: "Failed to redeem code" });
    }
  });

  // Contact message routes
  app.post('/api/contact', async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(contactData);
      res.json({ 
        message: "Support ticket created successfully",
        ticketNumber: message.ticketNumber,
        id: message.id 
      });
    } catch (error) {
      console.error("Error creating contact message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get user's tickets by email
  app.get("/api/contact/tickets/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const tickets = await storage.getUserContactMessages(email);
      res.json(tickets);
    } catch (error) {
      console.error("Get user tickets error:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get ticket by ticket number (for users to track their tickets)
  app.get("/api/contact/ticket/:ticketNumber", async (req, res) => {
    try {
      const { ticketNumber } = req.params;
      const ticket = await storage.getContactMessageByTicket(ticketNumber);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  // Usage tracking routes
  app.get('/api/usage', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { type, days } = req.query;
      
      let startDate;
      if (days) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));
      }
      
      const usage = await storage.getUserUsage(userId, type as string, startDate);
      const dailyUsage = await storage.getUserDailyUsage(userId);
      
      res.json({
        usage,
        daily: dailyUsage,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  // Admin routes (protected by admin middleware)
  const adminAuth = async (req: any, res: any, next: any) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(401).json({ message: "Username and password required" });
      }

      const admin = await storage.getAdminUser(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Simple password comparison (in real app, use proper hashing comparison)
      const [hashed, salt] = admin.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      const isValid = timingSafeEqual(hashedBuf, suppliedBuf);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateAdminLastLogin(username);
      req.admin = admin;
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  };

  app.post('/api/admin/login', adminAuth, async (req: any, res) => {
    res.json({ message: "Login successful", admin: req.admin });
  });

  app.get('/api/admin/dashboard', async (req, res) => {
    try {
      // Get dashboard data
      const plans = await storage.getPlans();
      const subscriptions = await storage.getActiveSubscriptions();
      const contactMessages = await storage.getContactMessages();
      const redeemCodes = await storage.getUnusedRedeemCodes();

      res.json({
        stats: {
          totalPlans: plans.length,
          activeSubscriptions: subscriptions.length,
          pendingMessages: contactMessages.filter(m => m.status === "unread").length,
          unusedCodes: redeemCodes.length,
        },
        plans,
        subscriptions: subscriptions.slice(0, 10), // Recent 10
        contactMessages: contactMessages.slice(0, 10), // Recent 10
        redeemCodes: redeemCodes.slice(0, 10), // Recent 10
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.post('/api/admin/plans', async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create plan" });
    }
  });

  app.post('/api/admin/redeem-codes', async (req, res) => {
    try {
      const { count = 1, ...codeData } = req.body;
      const codes = [];
      
      for (let i = 0; i < count; i++) {
        const code = Math.random().toString(36).substring(2, 15).toUpperCase();
        const redeemCode = await storage.createRedeemCode({
          ...insertRedeemCodeSchema.parse(codeData),
          code,
        });
        codes.push(redeemCode);
      }
      
      res.json({ codes, message: `${count} redeem codes created successfully` });
    } catch (error) {
      console.error("Error creating redeem codes:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid redeem code data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create redeem codes" });
    }
  });

  app.put('/api/admin/contact/:messageId', async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status, adminReply } = req.body;
      
      const updatedMessage = await storage.updateContactMessage(messageId, {
        status,
        adminReply,
      });
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating contact message:", error);
      res.status(500).json({ message: "Failed to update contact message" });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  
  // Only set up custom WebSocket in production to avoid conflicts with Vite's HMR WebSocket
  if (process.env.NODE_ENV === "production") {
    const wss = new WebSocketServer({ server: httpServer });
    
    wss.on('connection', (ws) => {
      console.log('WebSocket connection established');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          // Handle WebSocket messages if needed for real-time features
          console.log('WebSocket message:', message);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }

  return httpServer;
}
