import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Settings,
  Brain,
  Shield,
  Box,
  Key,
  Eye,
  EyeOff,
  Download,
  Trash2,
  AlertTriangle,
  FileCode,
  FileText,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsTab = "general" | "model" | "safety" | "artifacts" | "api";

interface UserSettings {
  theme: "light" | "dark" | "auto";
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  codeRenderingEnabled: boolean;
  markdownEnabled: boolean;
  preventCodeOverwrites: boolean;
  showLineAnnotations: boolean;
  showDiffViewer: boolean;
  openaiApiKey?: string;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<UserSettings>({
    theme: "auto",
    defaultModel: "gpt-4o",
    temperature: 70,
    maxTokens: 2048,
    streamingEnabled: true,
    codeRenderingEnabled: true,
    markdownEnabled: true,
    preventCodeOverwrites: true,
    showLineAnnotations: false,
    showDiffViewer: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { theme, setTheme } = useChatContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/user/settings"],
    enabled: open,
    retry: false,
  });

  // Fetch artifacts
  const { data: artifacts = [] } = useQuery({
    queryKey: ["/api/artifacts"],
    enabled: open && activeTab === "artifacts",
    retry: false,
  });

  // Load settings when data is available
  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      const settingsData = userSettings as UserSettings;
      setSettings({
        theme: settingsData.theme || "auto",
        defaultModel: settingsData.defaultModel || "gpt-4o",
        temperature: settingsData.temperature || 70,
        maxTokens: settingsData.maxTokens || 2048,
        streamingEnabled: settingsData.streamingEnabled ?? true,
        codeRenderingEnabled: settingsData.codeRenderingEnabled ?? true,
        markdownEnabled: settingsData.markdownEnabled ?? true,
        preventCodeOverwrites: settingsData.preventCodeOverwrites ?? true,
        showLineAnnotations: settingsData.showLineAnnotations ?? false,
        showDiffViewer: settingsData.showDiffViewer ?? true,
        openaiApiKey: settingsData.openaiApiKey || "",
      });
      setHasUnsavedChanges(false);
    }
  }, [userSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      const response = await apiRequest("PUT", "/api/user/settings", updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      setHasUnsavedChanges(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
      console.error("Settings save error:", error);
    },
  });

  // Clear all data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/user/data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Data cleared",
        description: "All your data has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear data.",
        variant: "destructive",
      });
    },
  });

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    
    // Apply theme change immediately
    if (key === "theme") {
      setTheme(value as any);
    }
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleCancel = () => {
    if (userSettings && typeof userSettings === 'object') {
      const settingsData = userSettings as UserSettings;
      setSettings({
        theme: settingsData.theme || "auto",
        defaultModel: settingsData.defaultModel || "gpt-4o",
        temperature: settingsData.temperature || 70,
        maxTokens: settingsData.maxTokens || 2048,
        streamingEnabled: settingsData.streamingEnabled ?? true,
        codeRenderingEnabled: settingsData.codeRenderingEnabled ?? true,
        markdownEnabled: settingsData.markdownEnabled ?? true,
        preventCodeOverwrites: settingsData.preventCodeOverwrites ?? true,
        showLineAnnotations: settingsData.showLineAnnotations ?? false,
        showDiffViewer: settingsData.showDiffViewer ?? true,
        openaiApiKey: settingsData.openaiApiKey || "",
      });
    }
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "model", label: "Model & Behavior", icon: Brain },
    { id: "safety", label: "Code Safety", icon: Shield },
    { id: "artifacts", label: "Artifacts", icon: Box },
    { id: "api", label: "API Keys", icon: Key },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isMobile 
          ? "max-w-[95vw] max-h-[95vh] p-0 w-[95vw] h-[95vh]" 
          : "max-w-5xl max-h-[90vh] p-0"
      )}>
        <div className={cn(
          isMobile 
            ? "flex flex-col h-full" 
            : "flex h-[80vh]"
        )}>
          {/* Navigation - Mobile: Horizontal tabs, Desktop: Sidebar */}
          {isMobile ? (
            <div className="bg-muted/30 border-b">
              <DialogHeader className="px-4 py-3">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Settings
                </DialogTitle>
              </DialogHeader>
              
              {/* Mobile tab navigation */}
              <ScrollArea className="pb-2">
                <div className="flex gap-1 px-4 pb-3">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "secondary" : "ghost"}
                        className="flex-shrink-0 px-3 py-2 h-auto text-xs"
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                      >
                        <IconComponent className="h-3 w-3 mr-1" />
                        {tab.label.split(" ")[0]}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="w-64 bg-muted/30 p-6 border-r">
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </DialogTitle>
              </DialogHeader>
              
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className={cn(isMobile ? "p-4" : "p-6")}>
                {/* General Settings */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Theme */}
                      <div>
                        <Label className="text-base font-medium">Theme</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose your preferred color scheme
                        </p>
                        <RadioGroup
                          value={settings.theme}
                          onValueChange={(value) => updateSetting("theme", value as any)}
                          className={cn(
                            isMobile 
                              ? "grid grid-cols-1 gap-4" 
                              : "flex gap-6"
                          )}
                        >
                          <div className={cn(
                            "flex items-center space-x-3",
                            isMobile && "p-3 border rounded-lg hover:bg-accent/50"
                          )}>
                            <RadioGroupItem value="light" id="light" className={isMobile ? "h-5 w-5" : ""} />
                            <Label htmlFor="light" className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              isMobile && "text-base flex-1"
                            )}>
                              <Sun className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                              Light
                            </Label>
                          </div>
                          <div className={cn(
                            "flex items-center space-x-3",
                            isMobile && "p-3 border rounded-lg hover:bg-accent/50"
                          )}>
                            <RadioGroupItem value="dark" id="dark" className={isMobile ? "h-5 w-5" : ""} />
                            <Label htmlFor="dark" className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              isMobile && "text-base flex-1"
                            )}>
                              <Moon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                              Dark
                            </Label>
                          </div>
                          <div className={cn(
                            "flex items-center space-x-3",
                            isMobile && "p-3 border rounded-lg hover:bg-accent/50"
                          )}>
                            <RadioGroupItem value="auto" id="auto" className={isMobile ? "h-5 w-5" : ""} />
                            <Label htmlFor="auto" className={cn(
                              "flex items-center gap-2 cursor-pointer",
                              isMobile && "text-base flex-1"
                            )}>
                              <Monitor className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                              Auto
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Language */}
                      <div>
                        <Label className="text-base font-medium">Language</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose your preferred language
                        </p>
                        <Select defaultValue="en">
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Data Management */}
                      <div>
                        <Label className="text-base font-medium text-destructive">
                          Data Management
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete all your data
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => clearDataMutation.mutate()}
                          disabled={clearDataMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {clearDataMutation.isPending ? "Clearing..." : "Clear all data"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model & Behavior Settings */}
                {activeTab === "model" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Model & Behavior</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Default Model */}
                      <div>
                        <Label className="text-base font-medium">Default Model</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose your preferred AI model
                        </p>
                        <Select
                          value={settings.defaultModel}
                          onValueChange={(value) => updateSetting("defaultModel", value)}
                        >
                          <SelectTrigger className={cn(
                            isMobile ? "w-full h-12 text-base" : "w-64"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Temperature */}
                      <div>
                        <Label className="text-base font-medium">
                          Temperature: {settings.temperature / 100}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Controls randomness in responses
                        </p>
                        <Slider
                          value={[settings.temperature]}
                          onValueChange={([value]) => updateSetting("temperature", value)}
                          max={100}
                          min={0}
                          step={5}
                          className={cn(
                            isMobile ? "w-full" : "w-64"
                          )}
                        />
                        <div className={cn(
                          "flex justify-between text-xs text-muted-foreground mt-1",
                          isMobile ? "w-full" : "w-64"
                        )}>
                          <span>Focused (0.0)</span>
                          <span>Creative (1.0)</span>
                        </div>
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <Label className="text-base font-medium">
                          Max Tokens: {settings.maxTokens}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Maximum length of AI responses
                        </p>
                        <Slider
                          value={[settings.maxTokens]}
                          onValueChange={([value]) => updateSetting("maxTokens", value)}
                          max={4096}
                          min={256}
                          step={256}
                          className={cn(
                            isMobile ? "w-full" : "w-64"
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Feature Toggles */}
                      <div className="space-y-4">
                        <div className={cn(
                          "flex items-center justify-between",
                          isMobile && "p-3 border rounded-lg"
                        )}>
                          <div className="flex-1">
                            <Label className={cn(
                              "text-base font-medium",
                              isMobile && "text-lg"
                            )}>Streaming Responses</Label>
                            <p className="text-sm text-muted-foreground">
                              Show responses as they're generated
                            </p>
                          </div>
                          <Switch
                            checked={settings.streamingEnabled}
                            onCheckedChange={(checked) => updateSetting("streamingEnabled", checked)}
                            className={isMobile ? "scale-125" : ""}
                          />
                        </div>

                        <div className={cn(
                          "flex items-center justify-between",
                          isMobile && "p-3 border rounded-lg"
                        )}>
                          <div className="flex-1">
                            <Label className={cn(
                              "text-base font-medium",
                              isMobile && "text-lg"
                            )}>Code Rendering</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable syntax highlighting for code
                            </p>
                          </div>
                          <Switch
                            checked={settings.codeRenderingEnabled}
                            onCheckedChange={(checked) => updateSetting("codeRenderingEnabled", checked)}
                            className={isMobile ? "scale-125" : ""}
                          />
                        </div>

                        <div className={cn(
                          "flex items-center justify-between",
                          isMobile && "p-3 border rounded-lg"
                        )}>
                          <div className="flex-1">
                            <Label className={cn(
                              "text-base font-medium",
                              isMobile && "text-lg"
                            )}>Markdown & LaTeX</Label>
                            <p className="text-sm text-muted-foreground">
                              Render formatted text and mathematical expressions
                            </p>
                          </div>
                          <Switch
                            checked={settings.markdownEnabled}
                            onCheckedChange={(checked) => updateSetting("markdownEnabled", checked)}
                            className={isMobile ? "scale-125" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Safety Settings */}
                {activeTab === "safety" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Code Safety & Developer Mode</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Prevent Full Code Overwrites</Label>
                          <p className="text-sm text-muted-foreground">
                            Only show diff/update changed blocks of code
                          </p>
                        </div>
                        <Switch
                          checked={settings.preventCodeOverwrites}
                          onCheckedChange={(checked) => updateSetting("preventCodeOverwrites", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Line-by-line Annotations</Label>
                          <p className="text-sm text-muted-foreground">
                            Show code explanations inline
                          </p>
                        </div>
                        <Switch
                          checked={settings.showLineAnnotations}
                          onCheckedChange={(checked) => updateSetting("showLineAnnotations", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Diff Viewer</Label>
                          <p className="text-sm text-muted-foreground">
                            Show changes before applying code updates
                          </p>
                        </div>
                        <Switch
                          checked={settings.showDiffViewer}
                          onCheckedChange={(checked) => updateSetting("showDiffViewer", checked)}
                        />
                      </div>

                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          These settings help prevent accidental overwrites of your code by requiring explicit confirmation for changes.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}

                {/* Artifacts Settings */}
                {activeTab === "artifacts" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Artifacts & Assets</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Generated Artifacts */}
                      <div>
                        <Label className="text-base font-medium mb-4 block">
                          Generated Artifacts
                        </Label>
                        
                        {(artifacts as any[]).length === 0 ? (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No artifacts generated yet</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Code files and documents will appear here
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-0">
                              {(artifacts as any[]).map((artifact: any, index: number) => (
                                <div
                                  key={artifact.id}
                                  className={cn(
                                    "flex items-center justify-between p-4",
                                    index < (artifacts as any[]).length - 1 && "border-b"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    {artifact.type === "code" ? (
                                      <FileCode className="h-5 w-5 text-blue-500" />
                                    ) : (
                                      <FileText className="h-5 w-5 text-green-500" />
                                    )}
                                    <div>
                                      <p className="font-medium">{artifact.fileName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {artifact.type} • v{artifact.version}
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Export All
                        </Button>
                        <Button variant="destructive" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Settings */}
                {activeTab === "api" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                    </div>

                    <div className="space-y-6">
                      {/* OpenAI API Key */}
                      <div>
                        <Label className="text-base font-medium">OpenAI API Key</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Your API key is stored securely and never shared
                        </p>
                        <div className={cn(
                          "relative",
                          isMobile ? "w-full" : "w-96"
                        )}>
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={settings.openaiApiKey || ""}
                            onChange={(e) => updateSetting("openaiApiKey", e.target.value)}
                            placeholder="sk-..."
                            className={cn(
                              "pr-10",
                              isMobile && "h-12 text-base"
                            )}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute right-0 top-0 h-full",
                              isMobile && "h-12 w-12"
                            )}
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                            ) : (
                              <Eye className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* API Usage Warning */}
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Using your own API key will incur charges on your OpenAI account. 
                          Monitor your usage to avoid unexpected costs.
                        </AlertDescription>
                      </Alert>

                      {/* Usage Statistics */}
                      <div>
                        <Label className="text-base font-medium mb-4 block">
                          Usage Statistics
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Tokens Used Today</p>
                              <p className="text-2xl font-semibold">2,847</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Estimated Cost</p>
                              <p className="text-2xl font-semibold">$0.42</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className={cn(
              "border-t bg-muted/30",
              isMobile ? "p-4" : "p-6"
            )}>
              <div className={cn(
                isMobile 
                  ? "flex flex-col gap-3" 
                  : "flex justify-between items-center"
              )}>
                {hasUnsavedChanges && (
                  <p className={cn(
                    "text-sm text-muted-foreground",
                    isMobile && "text-center"
                  )}>
                    You have unsaved changes
                  </p>
                )}
                <div className={cn(
                  "flex gap-3",
                  isMobile ? "w-full" : "ml-auto"
                )}>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className={cn(
                      isMobile && "flex-1 h-12 text-base"
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saveSettingsMutation.isPending}
                    className={cn(
                      isMobile && "flex-1 h-12 text-base"
                    )}
                  >
                    {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
