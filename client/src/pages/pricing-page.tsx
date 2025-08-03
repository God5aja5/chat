import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Crown, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Plan, Subscription } from "@shared/schema";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: currentSubscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      const res = await apiRequest("POST", "/api/subscription", {
        planId,
        status: "active",
        expiresAt,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: "Subscription activated!",
        description: "Your premium features are now available.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Star className="h-6 w-6 text-gray-500" />;
      case "premium":
        return <Zap className="h-6 w-6 text-blue-500" />;
      case "pro":
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return "border-gray-200";
      case "premium":
        return "border-blue-200 bg-blue-50/50";
      case "pro":
        return "border-purple-200 bg-purple-50/50";
      default:
        return "border-gray-200";
    }
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock the full potential of AI-powered conversations with our premium plans.
            From unlimited chats to advanced AI models and image generation.
          </p>
        </div>

        {currentSubscription && (
          <div className="mb-8 p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
            <p className="text-green-800 dark:text-green-200">
              You have an active subscription! Expires on{" "}
              {new Date(currentSubscription.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${getPlanColor(plan.name)} ${
                plan.name.toLowerCase() === "premium" ? "scale-105 shadow-lg" : ""
              }`}
              data-testid={`plan-card-${plan.name.toLowerCase()}`}
            >
              {plan.name.toLowerCase() === "premium" && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-lg">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${(plan.price / 100).toFixed(0)}
                  </span>
                  {plan.price > 0 && <span className="text-gray-500">/month</span>}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.name.toLowerCase() === "premium" ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribeMutation.isPending || plan.name.toLowerCase() === "free"}
                  data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
                >
                  {subscribeMutation.isPending && selectedPlan === plan.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : plan.name.toLowerCase() === "free" ? (
                    "Current Plan"
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We offer a 7-day money-back guarantee for all premium plans. Contact support for assistance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What AI models are included?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Premium plans include access to GPT-4o, GPT-4 Turbo, and all current OpenAI models, plus DALL-E for image generation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a usage limit?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Free plan has 5 chats per day. Premium and Pro plans offer unlimited usage within fair use guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}