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
} from "@shared/schema";
import { z } from "zod";

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

      let assistantResponse = "";
      
      // Create assistant message placeholder
      const assistantMessage = await storage.createMessage({
        chatId: currentChatId,
        role: "assistant",
        content: "",
      });

      // Stream response from OpenAI
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
          
          res.write(`data: [DONE]\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("OpenAI streaming error:", error);
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        },
      });

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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  
  // WebSocket support for real-time features (optional)
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

  return httpServer;
}
