import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { apiRequest } from "@/lib/queryClient";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Settings,
  Crown,
  Trash2,
  MoreHorizontal,
  Edit3,
  Menu,
  X,
  CreditCard,
  Mail,
  Gift,
} from "lucide-react";
import { Link } from "wouter";
import RedeemCodeModal from "@/components/RedeemCodeModal";
import type { Chat } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSettingsOpen: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onToggle, onSettingsOpen, className }: SidebarProps) {
  const { user, currentChat, createNewChat, loadChat, clearCurrentChat } = useChatContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { signOut } = useFirebaseAuth();

  // Fetch user's chats
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["/api/chats"],
    retry: false,
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiRequest("DELETE", `/api/chats/${chatId}`);
    },
    onSuccess: (_, deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      if (currentChat?.id === deletedChatId) {
        clearCurrentChat();
      }
      toast({
        title: "Chat deleted",
        description: "The conversation has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      });
    },
  });

  // Clear all chats mutation
  const clearAllChatsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/chats");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      clearCurrentChat();
      toast({
        title: "All chats cleared",
        description: "All conversations have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chats.",
        variant: "destructive",
      });
    },
  });

  const handleNewChat = async () => {
    await createNewChat();
    if (window.innerWidth < 768) {
      onToggle(); // Close sidebar on mobile
    }
  };

  const handleChatSelect = (chat: Chat) => {
    loadChat(chat.id);
    if (window.innerWidth < 768) {
      onToggle(); // Close sidebar on mobile
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteChatMutation.mutate(chatToDelete);
      setChatToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    clearAllChatsMutation.mutate();
    setClearAllDialogOpen(false);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col w-80 bg-gray-50 dark:bg-gray-800 border-r border-border transition-transform duration-300 z-50",
          "fixed md:relative inset-y-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button
            onClick={handleNewChat}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="ml-3 md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (chats as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              (chats as Chat[]).map((chat: Chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    currentChat?.id === chat.id && "bg-gray-100 dark:bg-gray-700"
                  )}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(chat.updatedAt || chat.createdAt || new Date())}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implement edit chat title
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2">
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="w-full justify-start text-sm"
            disabled={(chats as any[]).length === 0}
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Clear conversations
          </Button>
          <Button
            variant="ghost"
            onClick={onSettingsOpen}
            className="w-full justify-start text-sm"
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          <Link href="/pricing">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              data-testid="button-upgrade-plan"
            >
              <Crown className="h-4 w-4 mr-3 text-yellow-500" />
              Upgrade plan
            </Button>
          </Link>
          
          <Link href="/contact">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              data-testid="button-contact"
            >
              <Mail className="h-4 w-4 mr-3" />
              Contact Support
            </Button>
          </Link>
          
          <RedeemCodeModal>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              data-testid="button-redeem-code"
            >
              <Gift className="h-4 w-4 mr-3 text-green-500" />
              Redeem Code
            </Button>
          </RedeemCodeModal>

          <Separator className="my-2" />

          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                {/* Premium Crown Indicator */}
                <Crown className="h-3 w-3 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-xs text-green-600 font-medium">Premium Active</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Delete Chat Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the conversation permanently. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your conversations permanently. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
