import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Brain, Image as ImageIcon, FileText, Zap, Shield } from "lucide-react";

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel?: string;
}

const MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Latest model with enhanced capabilities",
    contextWindow: "128K tokens",
    supportsImages: true,
    supportsFiles: true,
    icon: Brain,
    badge: "Latest",
    badgeVariant: "default" as const,
    isPremium: false,
  },
  {
    id: "gpt-4o-premium",
    name: "GPT-4o Premium",
    description: "Enhanced GPT-4o with unlimited usage and priority access",
    contextWindow: "128K tokens",
    supportsImages: true,
    supportsFiles: true,
    icon: Brain,
    badge: "Premium",
    badgeVariant: "default" as const,
    isPremium: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Faster and more efficient",
    contextWindow: "128K tokens",
    supportsImages: true,
    supportsFiles: true,
    icon: Zap,
    badge: "Fast",
    badgeVariant: "secondary" as const,
    isPremium: false,
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Standard GPT-4 model",
    contextWindow: "8K tokens",
    supportsImages: false,
    supportsFiles: false,
    icon: Shield,
    badge: "Reliable",
    badgeVariant: "outline" as const,
    isPremium: false,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective",
    contextWindow: "16K tokens",
    supportsImages: false,
    supportsFiles: false,
    icon: Zap,
    badge: "Economic",
    badgeVariant: "outline" as const,
    isPremium: false,
  },
  {
    id: "worm-gpt",
    name: "Worm GPT",
    description: "Uncensored AI model with detailed responses",
    contextWindow: "32K tokens",
    supportsImages: false,
    supportsFiles: false,
    icon: Brain,
    badge: "Free",
    badgeVariant: "outline" as const,
    isPremium: false,
    dailyLimit: 10, // 10 messages per day for free users
  },

];

export function ModelSelector({ open, onOpenChange, currentModel = "gpt-4o" }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user subscription data
  const { data: subscription } = useQuery({
    queryKey: ["/api/user/subscription"],
    enabled: open, // Only fetch when modal is open
  });
  
  const isPremiumUser = subscription && (subscription as any)?.status === "active";
  
  // Update selectedModel when currentModel changes (prevent auto-revert)
  React.useEffect(() => {
    if (currentModel && currentModel !== selectedModel) {
      setSelectedModel(currentModel);
    }
  }, [currentModel]);

  const updateModelMutation = useMutation({
    mutationFn: async (model: string) => {
      const response = await apiRequest("PUT", "/api/user/settings", { defaultModel: model });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Model updated",
        description: `Default model changed to ${MODELS.find(m => m.id === selectedModel)?.name}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update model selection.",
        variant: "destructive",
      });
      console.error("Model update error:", error);
    },
  });

  const handleApply = () => {
    if (selectedModel !== currentModel) {
      updateModelMutation.mutate(selectedModel);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Select Model
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 max-h-[55vh]">
          <div className="space-y-4">
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
              {MODELS.map((model) => {
                const IconComponent = model.icon;
                const isSelected = selectedModel === model.id;
                
                return (
                  <div key={model.id} className="relative">
                    <Label
                      htmlFor={model.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                        model.isPremium && !isPremiumUser
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      )}
                    >
                      <RadioGroupItem 
                        value={model.id} 
                        id={model.id} 
                        className="mt-1" 
                        disabled={model.isPremium && !isPremiumUser}
                      />
                      
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{model.name}</span>
                            <Badge variant={model.badgeVariant}>{model.badge}</Badge>
                            {model.isPremium && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
                                  !isPremiumUser && "opacity-75"
                                )}
                              >
                                ⭐ Premium
                              </Badge>
                            )}
                            {model.isPremium && !isPremiumUser && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Requires Premium
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {model.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>{model.contextWindow}</span>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {model.supportsImages && (
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  <span>Images</span>
                                </div>
                              )}
                              {model.supportsFiles && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>Files</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </ScrollArea>

        {/* Model Comparison Note */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Model Capabilities</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">🖼️ Image Support</p>
              <p className="text-muted-foreground">GPT-4o, GPT-4 Turbo</p>
            </div>
            <div>
              <p className="font-medium mb-1">📁 File Support</p>
              <p className="text-muted-foreground">GPT-4o, GPT-4 Turbo</p>
            </div>
            <div>
              <p className="font-medium mb-1">⚡ Speed</p>
              <p className="text-muted-foreground">GPT-3.5 Turbo, GPT-4 Turbo</p>
            </div>
            <div>
              <p className="font-medium mb-1">🧠 Reasoning</p>
              <p className="text-muted-foreground">GPT-4o, GPT-4</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t bg-background sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateModelMutation.isPending}
            size="lg"
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={updateModelMutation.isPending || selectedModel === currentModel}
            size="lg"
            className="px-6"
          >
            {updateModelMutation.isPending ? "Applying..." : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
