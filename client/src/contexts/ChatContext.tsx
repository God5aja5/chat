import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat, UseChat } from "@/hooks/useChat";
import { useTheme, UseTheme } from "@/hooks/useTheme";

interface ChatContextValue extends UseChat, UseTheme {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ 
  children, 
  chatId 
}: { 
  children: ReactNode; 
  chatId?: string; 
}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const chat = useChat(chatId);
  const theme = useTheme();

  const value: ChatContextValue = {
    ...chat,
    ...theme,
    user,
    isAuthenticated,
    isLoading: authLoading || chat.isLoading,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
