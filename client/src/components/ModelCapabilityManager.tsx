import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Eye, 
  Mic, 
  Image as ImageIcon, 
  Volume2, 
  Search, 
  Upload,
  Check,
  X
} from "lucide-react";

interface ModelCapability {
  id: string;
  modelName: string;
  displayName: string;
  supportsText: boolean;
  supportsImageInput: boolean;
  supportsAudioInput: boolean;
  supportsImageOutput: boolean;
  supportsAudioOutput: boolean;
  supportsWebSearch: boolean;
  supportsFileUpload: boolean;
  isActive: boolean;
}

export function ModelCapabilityManager() {
  const queryClient = useQueryClient();

  const { data: capabilities, isLoading } = useQuery({
    queryKey: ["/api/admin/model-capabilities"],
  });

  const updateCapabilityMutation = useMutation({
    mutationFn: async ({ modelName, data }: { modelName: string; data: Partial<ModelCapability> }) => {
      return await apiRequest(`/api/admin/model-capabilities/${modelName}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/model-capabilities"] });
      toast({
        title: "Success",
        description: "Model capability updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update model capability",
        variant: "destructive",
      });
    },
  });

  const handleCapabilityToggle = (modelName: string, field: keyof ModelCapability, value: boolean) => {
    updateCapabilityMutation.mutate({
      modelName,
      data: { [field]: value }
    });
  };

  const CapabilityIcon = ({ supports, icon: Icon, label }: { supports: boolean; icon: any; label: string }) => (
    <div className="flex items-center gap-2" data-testid={`capability-${label.toLowerCase()}`}>
      <Icon className={`h-4 w-4 ${supports ? 'text-green-600' : 'text-gray-400'}`} />
      <span className={supports ? 'text-green-600' : 'text-gray-400'}>{label}</span>
      {supports ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-gray-400" />}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Model Capabilities Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {capabilities?.map((capability: ModelCapability) => (
            <div key={capability.id} className="border rounded-lg p-4 space-y-4" data-testid={`model-${capability.modelName}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{capability.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{capability.modelName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={capability.isActive}
                    onCheckedChange={(checked) => handleCapabilityToggle(capability.modelName, 'isActive', checked)}
                    data-testid={`switch-active-${capability.modelName}`}
                  />
                  <Badge variant={capability.isActive ? "default" : "secondary"}>
                    {capability.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CapabilityIcon supports={capability.supportsText} icon={Brain} label="Text" />
                <CapabilityIcon supports={capability.supportsImageInput} icon={Eye} label="Image Input" />
                <CapabilityIcon supports={capability.supportsAudioInput} icon={Mic} label="Audio Input" />
                <CapabilityIcon supports={capability.supportsImageOutput} icon={ImageIcon} label="Image Output" />
                <CapabilityIcon supports={capability.supportsAudioOutput} icon={Volume2} label="Audio Output" />
                <CapabilityIcon supports={capability.supportsWebSearch} icon={Search} label="Web Search" />
                <CapabilityIcon supports={capability.supportsFileUpload} icon={Upload} label="File Upload" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={capability.supportsImageInput}
                    onCheckedChange={(checked) => handleCapabilityToggle(capability.modelName, 'supportsImageInput', checked)}
                    size="sm"
                    data-testid={`switch-image-input-${capability.modelName}`}
                  />
                  <span className="text-sm">Image Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={capability.supportsAudioInput}
                    onCheckedChange={(checked) => handleCapabilityToggle(capability.modelName, 'supportsAudioInput', checked)}
                    size="sm"
                    data-testid={`switch-audio-input-${capability.modelName}`}
                  />
                  <span className="text-sm">Audio Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={capability.supportsWebSearch}
                    onCheckedChange={(checked) => handleCapabilityToggle(capability.modelName, 'supportsWebSearch', checked)}
                    size="sm"
                    data-testid={`switch-web-search-${capability.modelName}`}
                  />
                  <span className="text-sm">Web Search</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={capability.supportsFileUpload}
                    onCheckedChange={(checked) => handleCapabilityToggle(capability.modelName, 'supportsFileUpload', checked)}
                    size="sm"
                    data-testid={`switch-file-upload-${capability.modelName}`}
                  />
                  <span className="text-sm">File Upload</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}