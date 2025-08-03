import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ModelSelector } from "./ModelSelector";
import { SettingsModal } from "./SettingsModal";
import { useChatContext } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Menu, Bot, Brain, Moon, Sun } from "lucide-react";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { currentChat, actualTheme, toggleTheme, user } = useChatContext();

  const getCurrentModel = () => {
    return currentChat?.model || user?.settings?.defaultModel || "gpt-4o";
  };

  const getModelDisplayName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo", 
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    };
    return modelNames[modelId] || modelId;
  };

  return (
    <div className={cn("flex h-screen overflow-hidden", className)}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen || !isMobile}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSettingsOpen={() => setSettingsOpen(true)}
        className={cn(!isMobile && "relative")}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <h1 className="text-lg font-semibold">ChatGPT</h1>
            
            {/* Current Model Badge */}
            <Badge variant="secondary" className="flex items-center gap-2">
              <Bot className="h-3 w-3 text-primary" />
              <span>{getModelDisplayName(getCurrentModel())}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <Button
              variant="ghost"
              onClick={() => setModelSelectorOpen(true)}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Model</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {actualTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <MessageList className="flex-1" />

        {/* Input */}
        <MessageInput />
      </div>

      {/* Modals */}
      <ModelSelector
        open={modelSelectorOpen}
        onOpenChange={setModelSelectorOpen}
        currentModel={getCurrentModel()}
      />
      
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
