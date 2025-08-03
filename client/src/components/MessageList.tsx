import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageActions } from "./MessageActions";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ChatMessage } from "@/hooks/useChat";
import { formatDistanceToNow, format } from "date-fns";

interface MessageListProps {
  className?: string;
}

export function MessageList({ className }: MessageListProps) {
  const { messages, isStreaming, actualTheme, user } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
          <p className="text-muted-foreground">Start a conversation with ChatGPT</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("flex-1 overflow-y-auto scroll-smooth px-4 py-6", className)}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <MessageItem
                message={message}
                user={user}
                theme={actualTheme}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">ChatGPT is typing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: ChatMessage;
  user: any;
  theme: "light" | "dark";
}

function MessageItem({ message, user, theme }: MessageItemProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
            <AvatarFallback className="bg-gray-200 dark:bg-gray-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="group/message relative">
          {/* Message Body */}
          <div className="prose dark:prose-invert max-w-none">
            {isAssistant ? (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const inline = !className;
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="relative">
                        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-sm rounded-t-lg">
                          <span className="text-gray-300">{match[1]}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy code"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={theme === "dark" ? oneDark : oneLight}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-t-none"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          )}

          {/* Message Actions */}
          {!message.isStreaming && (
            <div className="opacity-0 group-hover/message:opacity-100 transition-opacity">
              <MessageActions message={message} />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp || new Date()), 'HH:mm')}
          </span>
          {message.isEdited && (
            <Badge variant="secondary" className="text-xs">
              Edited
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
