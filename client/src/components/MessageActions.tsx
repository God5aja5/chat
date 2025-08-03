import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { 
  Copy, 
  RotateCcw, 
  Share2, 
  Edit3, 
  Download, 
  Image,
  MoreHorizontal,
  Check
} from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageActionsProps {
  message: ChatMessage;
}

export function MessageActions({ message }: MessageActionsProps) {
  const { editMessage, regenerateMessage } = useChatContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() !== message.content) {
      await editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    await regenerateMessage(message.id);
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleShareAction = async (action: "link" | "txt" | "image") => {
    switch (action) {
      case "link":
        // Create a shareable link (this would be implemented with a backend endpoint)
        const shareUrl = `${window.location.origin}/share/${message.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard.",
        });
        break;
      
      case "txt":
        // Download as text file
        const blob = new Blob([message.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `message-${message.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      
      case "image":
        // Export as image (would need canvas implementation)
        toast({
          title: "Coming Soon",
          description: "Image export will be available soon.",
        });
        break;
    }
    setShareDialogOpen(false);
  };

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  if (isEditing && isUser) {
    return (
      <div className="mt-4 space-y-3">
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[100px] resize-none"
          placeholder="Edit your message..."
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEdit}>
            Save
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setIsEditing(false);
              setEditContent(message.content);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mt-4">
        {/* Copy */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 text-xs"
        >
          {copied ? (
            <Check className="h-3 w-3 mr-1" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>

        {/* Edit (for user messages) */}
        {isUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}

        {/* Regenerate (for assistant messages) */}
        {isAssistant && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Regenerate
          </Button>
        )}

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 px-2 text-xs"
        >
          <Share2 className="h-3 w-3 mr-1" />
          Share
        </Button>

        {/* More actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy message
            </DropdownMenuItem>
            {isAssistant && (
              <DropdownMenuItem onClick={handleRegenerate}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate response
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Message</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleShareAction("link")}
            >
              <Share2 className="h-4 w-4 mr-3 text-blue-500" />
              Copy message link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleShareAction("txt")}
            >
              <Download className="h-4 w-4 mr-3 text-green-500" />
              Download as .txt
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleShareAction("image")}
            >
              <Image className="h-4 w-4 mr-3 text-purple-500" />
              Export as image
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
