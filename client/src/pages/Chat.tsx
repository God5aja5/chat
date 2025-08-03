import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeProvider } from "@/components/ThemeProvider";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatPageProps {
  chatId?: string;
}

export default function ChatPage({ chatId }: ChatPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the chat interface.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render chat if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ChatProvider chatId={chatId}>
        <ChatInterface />
      </ChatProvider>
    </ThemeProvider>
  );
}
