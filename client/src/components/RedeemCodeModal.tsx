import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RedeemCodeModalProps {
  children: React.ReactNode;
}

export default function RedeemCodeModal({ children }: RedeemCodeModalProps) {
  const [code, setCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const redeemMutation = useMutation({
    mutationFn: async (redeemCode: string) => {
      const res = await apiRequest("POST", "/api/redeem", { code: redeemCode });
      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: "Code redeemed successfully!",
        description: data.message || "Your subscription has been activated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Please enter a code",
        description: "Redeem code is required",
        variant: "destructive",
      });
      return;
    }
    redeemMutation.mutate(code.trim().toUpperCase());
  };

  const handleClose = () => {
    setIsOpen(false);
    setCode("");
    setSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            Redeem Code
          </DialogTitle>
          <DialogDescription>
            Enter your redeem code to activate premium features
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Code Redeemed Successfully!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your premium subscription has been activated. Enjoy unlimited access to all features!
            </p>
            <Button onClick={handleClose} className="w-full" data-testid="button-close-success">
              Continue
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="redeem-code">Redeem Code</Label>
              <Input
                id="redeem-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your redeem code"
                className="font-mono"
                maxLength={20}
                data-testid="input-redeem-code"
              />
              <p className="text-xs text-gray-500 mt-1">
                Code format: ABC123DEF456 (case insensitive)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel-redeem"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={redeemMutation.isPending || !code.trim()}
                className="flex-1"
                data-testid="button-redeem-submit"
              >
                {redeemMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Redeeming...
                  </div>
                ) : (
                  "Redeem Code"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium mb-2">How to get redeem codes:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Promotional campaigns and giveaways</li>
            <li>• Partner referrals and collaborations</li>
            <li>• Special events and community rewards</li>
            <li>• Contact support for assistance</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}