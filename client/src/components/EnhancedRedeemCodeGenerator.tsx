import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Gift, 
  Plus, 
  Copy, 
  Check, 
  Calendar,
  User,
  Clock,
  Key
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
}

interface RedeemCode {
  id: string;
  code: string;
  plan: {
    name: string;
  };
  duration: number;
  durationType: string;
  isUsed: boolean;
  usedBy?: {
    name: string;
    email: string;
  };
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export function EnhancedRedeemCodeGenerator() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<"months" | "years">("months");
  const [codeCount, setCodeCount] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/plans"],
  });

  const { data: redeemCodes, isLoading: codesLoading } = useQuery({
    queryKey: ["/api/admin/redeem-codes"],
  });

  const generateCodesMutation = useMutation({
    mutationFn: async (data: { planName: string; duration: number; durationType: "months" | "years"; count: number }) => {
      return await apiRequest("/api/admin/redeem-codes/generate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
      setIsGenerateDialogOpen(false);
      toast({
        title: "Success",
        description: `${codeCount} redeem code(s) generated successfully`,
      });
      // Reset form
      setSelectedPlan("");
      setDuration(1);
      setDurationType("months");
      setCodeCount(1);
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to generate redeem codes",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied",
        description: "Redeem code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    if (!selectedPlan || duration < 1 || codeCount < 1) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedPlanData = plans?.find((p: Plan) => p.name === selectedPlan);
    if (!selectedPlanData) {
      toast({
        title: "Error",
        description: "Selected plan not found",
        variant: "destructive",
      });
      return;
    }

    generateCodesMutation.mutate({
      planName: selectedPlan,
      duration,
      durationType,
      count: codeCount,
    });
  };

  return (
    <div className="space-y-6">
      {/* Generate New Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Generate Redeem Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-open-generate-dialog">
                <Plus className="h-4 w-4" />
                Generate New Codes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Redeem Codes</DialogTitle>
                <DialogDescription>
                  Create redeem codes for users to upgrade their subscriptions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-select">Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger data-testid="select-plan">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.filter((plan: Plan) => plan.isActive).map((plan: Plan) => (
                        <SelectItem key={plan.id} value={plan.name}>
                          {plan.name} - ${plan.price/100}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max={durationType === "years" ? 10 : 120}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                      data-testid="input-duration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration-type">Type</Label>
                    <Select value={durationType} onValueChange={(value: "months" | "years") => setDurationType(value)}>
                      <SelectTrigger data-testid="select-duration-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="code-count">Number of Codes</Label>
                  <Input
                    id="code-count"
                    type="number"
                    min="1"
                    max="100"
                    value={codeCount}
                    onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                    data-testid="input-code-count"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateCodesMutation.isPending}
                    data-testid="button-generate-codes"
                  >
                    {generateCodesMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Existing Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Redeem Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {codesLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : !redeemCodes?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No redeem codes found. Generate your first codes above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redeemCodes.map((code: RedeemCode) => (
                <div key={code.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4" data-testid={`redeem-code-${code.id}`}>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {code.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-copy-${code.id}`}
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        {code.plan.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {code.duration} {code.durationType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created {new Date(code.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {code.isUsed && code.usedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3" />
                        <span>Used by {code.usedBy.name} ({code.usedBy.email})</span>
                        {code.usedAt && (
                          <span className="text-muted-foreground">
                            on {new Date(code.usedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={code.isUsed ? "secondary" : "default"}>
                      {code.isUsed ? "Used" : "Available"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}