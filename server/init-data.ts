import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function initializeData() {
  try {
    // Check if data already exists
    const existingPlans = await storage.getPlans();
    const existingAdmin = await storage.getAdminUser("admin");

    // Create initial plans if they don't exist
    if (existingPlans.length === 0) {
      console.log("Creating initial plans...");
      
      // Free Plan
      await storage.createPlan({
        name: "Free",
        price: 0,
        duration: "monthly",
        features: ["5 chats per day", "Basic AI models", "Community support"],
        chatLimit: null,
        imageLimit: null,
        dailyLimit: 5,
        isActive: true,
      });

      // Premium Plan - $8/month
      await storage.createPlan({
        name: "Premium",
        price: 800, // in cents
        duration: "monthly",
        features: [
          "Unlimited chats",
          "All AI models including GPT-4o",
          "DALL-E image generation",
          "Priority support",
          "Advanced settings",
          "File uploads up to 50MB"
        ],
        chatLimit: null,
        imageLimit: null,
        dailyLimit: null,
        isActive: true,
      });

      // Pro Plan - $15/month
      await storage.createPlan({
        name: "Pro",
        price: 1500, // in cents
        duration: "monthly",
        features: [
          "Everything in Premium",
          "Advanced AI models",
          "Unlimited DALL-E generations",
          "Custom AI instructions",
          "API access",
          "File uploads up to 100MB",
          "24/7 priority support",
          "Beta features access"
        ],
        chatLimit: null,
        imageLimit: null,
        dailyLimit: null,
        isActive: true,
      });

      console.log("Plans created successfully!");
    }

    // Create admin user if doesn't exist
    if (!existingAdmin) {
      console.log("Creating admin user...");
      const hashedPassword = await hashPassword("God@111983");
      
      await storage.createAdminUser({
        username: "admin",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin user created successfully!");
    }

    console.log("Data initialization completed!");
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}