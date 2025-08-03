import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, Chat, ChatWithMessages, InsertMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage extends Message {
  isStreaming?: boolean;
  files?: File[];
}

export interface UseChat {
  messages: ChatMessage[];
  currentChat: Chat | null;
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (content: string, files?: FileList) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createNewChat: (title?: string) => Promise<void>;
  loadChat: (chatId: string) => void;
  clearCurrentChat: () => void;
  stopGeneration: () => void;
}

export function useChat(chatId?: string): UseChat {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load chat data
  const { data: chatData, isLoading } = useQuery({
    queryKey: ["/api/chats", chatId],
    enabled: !!chatId,
    retry: false,
  });

  useEffect(() => {
    if (chatData && typeof chatData === 'object' && 'chat' in chatData) {
      setCurrentChat((chatData as any).chat);
      setMessages((chatData as any).messages || []);
    }
  }, [chatData]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      files,
      chatId: targetChatId,
    }: {
      content: string;
      files?: FileList;
      chatId?: string;
    }) => {
      const formData = new FormData();
      formData.append("content", content);
      
      if (targetChatId) {
        formData.append("chatId", targetChatId);
      }

      if (files) {
        Array.from(files).forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.body;
    },
    onSuccess: (responseStream, variables) => {
      if (!responseStream) return;

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        chatId: variables.chatId || currentChat?.id || "",
        role: "user",
        content: variables.content,
        timestamp: new Date(),
        tokens: null,
        isEdited: false,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add streaming AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        chatId: variables.chatId || currentChat?.id || "",
        role: "assistant",
        content: "",
        timestamp: new Date(),
        tokens: null,
        isEdited: false,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsStreaming(true);

      // Handle streaming response
      handleStreamResponse(responseStream, aiMessage.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Send message error:", error);
    },
  });

  const handleStreamResponse = async (stream: ReadableStream, messageId: string) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsStreaming(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Invalid JSON, continue
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream reading error:", error);
      setIsStreaming(false);
    } finally {
      reader.releaseLock();
    }
  };

  // Create new chat
  const createNewChatMutation = useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiRequest("POST", "/api/chats", {
        title: title || "New Chat",
      });
      return response.json();
    },
    onSuccess: (newChat) => {
      setCurrentChat(newChat);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new chat.",
        variant: "destructive",
      });
      console.error("Create chat error:", error);
    },
  });

  // Edit message
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await apiRequest("PUT", `/api/messages/${messageId}`, { content });
      return response.json();
    },
    onSuccess: (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to edit message.",
        variant: "destructive",
      });
    },
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: (_, messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useCallback(
    async (content: string, files?: FileList) => {
      if (!content.trim()) return;

      sendMessageMutation.mutate({
        content,
        files,
        chatId: currentChat?.id,
      });
    },
    [currentChat?.id, sendMessageMutation]
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      // Find the message and regenerate response
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== "assistant") return;

      // Find the previous user message
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const userMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find((m) => m.role === "user");

      if (userMessage) {
        // Remove the AI message and regenerate
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        await sendMessage(userMessage.content);
      }
    },
    [messages, sendMessage]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      editMessageMutation.mutate({ messageId, content: newContent });
    },
    [editMessageMutation]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      deleteMessageMutation.mutate(messageId);
    },
    [deleteMessageMutation]
  );

  const createNewChat = useCallback(
    async (title?: string) => {
      createNewChatMutation.mutate(title);
    },
    [createNewChatMutation]
  );

  const loadChat = useCallback((newChatId: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/chats", newChatId] });
  }, [queryClient]);

  const clearCurrentChat = useCallback(() => {
    setCurrentChat(null);
    setMessages([]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  }, []);

  return {
    messages,
    currentChat,
    isLoading,
    isStreaming,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    createNewChat,
    loadChat,
    clearCurrentChat,
    stopGeneration,
  };
}
