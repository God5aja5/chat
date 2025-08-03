import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface StreamingChatOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
}

export class OpenAIService {
  private getClient(apiKey: string): OpenAI {
    return new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: false // Server-side only
    });
  }

  async streamChatCompletion(options: StreamingChatOptions): Promise<void> {
    const {
      messages,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      apiKey,
      onToken,
      onComplete,
      onError
    } = options;

    try {
      const openai = this.getClient(apiKey);
      
      const stream = await openai.chat.completions.create({
        model,
        messages,
        temperature: temperature / 100, // Convert from 0-100 to 0-1
        max_tokens: maxTokens,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onToken?.(content);
        }
      }

      onComplete?.(fullResponse);
    } catch (error) {
      console.error("OpenAI streaming error:", error);
      onError?.(error as Error);
    }
  }

  async getChatCompletion(options: ChatCompletionOptions): Promise<string> {
    const {
      messages,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      apiKey
    } = options;

    try {
      const openai = this.getClient(apiKey);
      
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature: temperature / 100, // Convert from 0-100 to 0-1
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI completion error:", error);
      throw error;
    }
  }

  async generateImage(prompt: string, apiKey: string, options?: {
    size?: "1024x1024" | "1792x1024" | "1024x1792";
    quality?: "standard" | "hd";
    model?: "dall-e-2" | "dall-e-3";
  }): Promise<{ url: string }> {
    try {
      const openai = this.getClient(apiKey);
      
      const response = await openai.images.generate({
        model: options?.model || "dall-e-3",
        prompt,
        n: 1,
        size: options?.size || "1024x1024",
        quality: options?.quality || "standard",
      });

      return { url: response.data?.[0]?.url || "" };
    } catch (error) {
      console.error("OpenAI image generation error:", error);
      throw error;
    }
  }

  validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith("sk-") && apiKey.length > 20;
  }

  getSupportedModels(): Array<{
    id: string;
    name: string;
    description: string;
    supportsImages: boolean;
    supportsFiles: boolean;
    contextWindow: number;
  }> {
    return [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Latest model with enhanced capabilities",
        supportsImages: true,
        supportsFiles: true,
        contextWindow: 128000,
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Faster and more efficient",
        supportsImages: true,
        supportsFiles: true,
        contextWindow: 128000,
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        description: "Standard GPT-4 model",
        supportsImages: false,
        supportsFiles: false,
        contextWindow: 8192,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Fast and cost-effective",
        supportsImages: false,
        supportsFiles: false,
        contextWindow: 16385,
      },
    ];
  }
}

export const openaiService = new OpenAIService();
