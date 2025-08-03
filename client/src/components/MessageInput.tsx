import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "./FileUpload";
import { useChatContext } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Square, 
  Paperclip, 
  X,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react";

interface MessageInputProps {
  className?: string;
}

export function MessageInput({ className }: MessageInputProps) {
  const { sendMessage, isStreaming, stopGeneration } = useChatContext();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
  };

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !files) return;

    try {
      await sendMessage(trimmedInput, files || undefined);
      setInput("");
      setFiles(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    setFiles(selectedFiles);
    setShowFileUpload(false);
  };

  const handleFileRemove = (index: number) => {
    if (!files) return;
    
    const dt = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) dt.items.add(file);
    });
    
    setFiles(dt.files.length > 0 ? dt.files : null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("text/")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const canSend = input.trim() || files;

  return (
    <div className={cn("border-t border-border bg-background p-4", className)}>
      <div className="max-w-3xl mx-auto">
        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="mb-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              onCancel={() => setShowFileUpload(false)}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        )}

        {/* File Preview */}
        {files && files.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg border border-dashed">
            <div className="space-y-2">
              {Array.from(files).map((file, index) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileRemove(index)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <div className="flex items-end gap-3 p-3 bg-muted rounded-xl border">
            {/* File Upload Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFileUpload(true)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              disabled={isStreaming}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Text Input */}
            <div className="flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatGPT..."
                className="min-h-[40px] max-h-32 resize-none border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isStreaming}
              />
            </div>

            {/* Send/Stop Button */}
            <Button
              onClick={isStreaming ? stopGeneration : handleSend}
              disabled={!canSend && !isStreaming}
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                isStreaming 
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              size="icon"
            >
              {isStreaming ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
            <span>ChatGPT can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
      />
    </div>
  );
}
