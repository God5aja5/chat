import { storage } from "./storage";

// Initialize model capabilities based on your specifications
export async function initializeModelCapabilities() {
  console.log("Initializing model capabilities...");

  const modelConfigs = [
    // GPT Models
    { modelName: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: false },
    { modelName: "gpt-3.5-turbo-instruct", displayName: "GPT-3.5 Turbo Instruct", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "gpt-4", displayName: "GPT-4", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4-turbo", displayName: "GPT-4 Turbo", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4.1", displayName: "GPT-4.1", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4.5-preview", displayName: "GPT-4.5 Preview", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4o", displayName: "GPT-4o", supportsText: true, supportsImageInput: true, supportsAudioInput: true, supportsImageOutput: true, supportsAudioOutput: true, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4o-mini", displayName: "GPT-4o Mini", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: true },
    { modelName: "gpt-4o-realtime", displayName: "GPT-4o Realtime", supportsText: true, supportsImageInput: true, supportsAudioInput: true, supportsImageOutput: true, supportsAudioOutput: true, supportsWebSearch: true, supportsFileUpload: true },
    
    // Codex & Davinci Models
    { modelName: "codex-mini-latest", displayName: "Codex Mini Latest", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "davinci-002", displayName: "Davinci-002", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "babbage-002", displayName: "Babbage-002", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    
    // O Series Models
    { modelName: "o1", displayName: "O1", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "o3", displayName: "O3", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "o4-mini", displayName: "O4 Mini", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "o3-deep-research", displayName: "O3 Deep Research", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: false },
    { modelName: "o4-mini-deep-research", displayName: "O4 Mini Deep Research", supportsText: true, supportsImageInput: true, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: true, supportsFileUpload: false },
    
    // Specialized Models
    { modelName: "text-embedding-3-small", displayName: "Text Embedding 3 Small", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "text-embedding-3-large", displayName: "Text Embedding 3 Large", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "tts-1", displayName: "TTS-1", supportsText: false, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: true, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "tts-1-hd", displayName: "TTS-1 HD", supportsText: false, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: true, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "whisper-1", displayName: "Whisper-1", supportsText: false, supportsImageInput: false, supportsAudioInput: true, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "omni-moderation-latest", displayName: "Omni Moderation Latest", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
    { modelName: "computer-use-preview", displayName: "Computer Use Preview", supportsText: true, supportsImageInput: false, supportsAudioInput: false, supportsImageOutput: false, supportsAudioOutput: false, supportsWebSearch: false, supportsFileUpload: false },
  ];

  try {
    for (const config of modelConfigs) {
      const existing = await storage.getModelCapability(config.modelName);
      if (!existing) {
        await storage.createModelCapability(config);
        console.log(`Created model capability for ${config.modelName}`);
      }
    }
    console.log("Model capabilities initialized successfully!");
  } catch (error) {
    console.error("Error initializing model capabilities:", error);
  }
}