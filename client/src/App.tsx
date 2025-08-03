import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import ChatPage from "@/pages/Chat";
import PricingPage from "@/pages/pricing-page";
import ContactPage from "@/pages/contact-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Landing page for non-authenticated users */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Chat interface for authenticated users */}
          <Route path="/" component={() => <ChatPage />} />
          <Route path="/chat" component={() => <ChatPage />} />
          <Route path="/chat/:chatId" component={({ params }) => <ChatPage chatId={params.chatId} />} />
        </>
      )}
      
      {/* Public pages available to all users */}
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin" component={AdminPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
