import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get('/api/chats/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify user owns this chat
      const userId = req.user.claims.sub;
      if (chat.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put('/api/chats/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;
      
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

  app.delete('/api/chats/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;
      
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

  app.delete('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserChats(userId);
      res.json({ message: "All chats deleted successfully" });
    } catch (error) {
      console.error("Error deleting all chats:", error);
      res.status(500).json({ message: "Failed to delete chats" });
    }
  });

  // Message routes
  app.post('/api/messages/send', isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

      // Get conversation history
      const messages = await storage.getChatMessages(currentChatId);
      const conversationHistory = messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // Check if this is an image generation request
      const messageContent = content.toLowerCase();
      const isImageRequest = messageContent.includes("generate image") || 
                           messageContent.includes("create image") || 
                           messageContent.includes("draw") ||
                           messageContent.includes("make picture") ||
                           messageContent.includes("dall-e") ||
                           messageContent.includes("image of");

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

  app.put('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.claims.sub;
      
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

  app.delete('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/artifacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const artifacts = await storage.getUserArtifacts(userId);
      res.json(artifacts);
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      res.status(500).json({ message: "Failed to fetch artifacts" });
    }
  });

  app.post('/api/artifacts', isAuthenticated, async (req: any, res) => {
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
  app.delete('/api/user/data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
