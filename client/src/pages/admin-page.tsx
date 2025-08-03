import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  Gift, 
  BarChart3, 
  Shield,
  Eye,
  Trash2,
  Send,
  Copy,
  Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminDashboard {
  stats: {
    totalPlans: number;
    activeSubscriptions: number;
    pendingMessages: number;
    unusedCodes: number;
  };
  plans: any[];
  subscriptions: any[];
  contactMessages: any[];
  redeemCodes: any[];
}

export default function AdminPage() {
  const [adminAuth, setAdminAuth] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [activeTab, setActiveTab] = useState("dashboard");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/login", credentials);
      return res.json();
    },
    onSuccess: () => {
      setAdminAuth(true);
      toast({
        title: "Login successful",
        description: "Welcome to the admin panel",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: dashboardData, isLoading } = useQuery<AdminDashboard>({
    queryKey: ["/api/admin/dashboard"],
    enabled: adminAuth,
  });

  const createRedeemCodeMutation = useMutation({
    mutationFn: async (data: { planId: string; duration: number; count: number }) => {
      const res = await apiRequest("POST", "/api/admin/redeem-codes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Redeem codes created",
        description: "New redeem codes have been generated successfully",
      });
    },
  });

  const replyToMessageMutation = useMutation({
    mutationFn: async ({ messageId, reply }: { messageId: string; reply: string }) => {
      const res = await apiRequest("PUT", `/api/admin/contact/${messageId}`, {
        adminReply: reply,
        status: "replied",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Reply sent",
        description: "Your reply has been recorded",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied to your clipboard",
    });
  };

  if (!adminAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your administrator credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                  data-testid="input-admin-username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your ChatGPT clone platform</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="codes" data-testid="tab-codes">
              <Gift className="h-4 w-4 mr-2" />
              Redeem Codes
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-plans">
                    {dashboardData?.stats.totalPlans || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-active-subscriptions">
                    {dashboardData?.stats.activeSubscriptions || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-pending-messages">
                    {dashboardData?.stats.pendingMessages || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unused Codes</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-unused-codes">
                    {dashboardData?.stats.unusedCodes || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData?.plans.map((plan) => (
                      <div key={plan.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-600">${(plan.price / 100).toFixed(0)}/month</p>
                        </div>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>• {dashboardData?.stats.activeSubscriptions} active subscriptions</p>
                    <p>• {dashboardData?.stats.pendingMessages} unread messages</p>
                    <p>• {dashboardData?.stats.unusedCodes} unused redeem codes</p>
                    <p>• Platform running smoothly</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions</CardTitle>
                <CardDescription>
                  Recent subscription activity and user management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell data-testid={`subscription-email-${sub.id}`}>
                          {sub.user?.email || 'N/A'}
                        </TableCell>
                        <TableCell>{sub.plan?.name}</TableCell>
                        <TableCell>${(sub.plan?.price / 100).toFixed(0)}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sub.expiresAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>
                  Customer support requests and inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.contactMessages.map((message) => (
                    <Card key={message.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium" data-testid={`message-subject-${message.id}`}>
                            {message.subject}
                          </h4>
                          <p className="text-sm text-gray-600">
                            From: {message.name} ({message.email})
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={message.status === "unread" ? "destructive" : "default"}>
                          {message.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{message.message}</p>
                      
                      {message.adminReply && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-3">
                          <p className="text-sm"><strong>Admin Reply:</strong></p>
                          <p className="text-sm">{message.adminReply}</p>
                        </div>
                      )}
                      
                      {message.status === "unread" && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your reply..."
                            id={`reply-${message.id}`}
                            className="flex-1"
                            data-testid={`textarea-reply-${message.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const reply = (document.getElementById(`reply-${message.id}`) as HTMLTextAreaElement)?.value;
                              if (reply) {
                                replyToMessageMutation.mutate({ messageId: message.id, reply });
                              }
                            }}
                            data-testid={`button-reply-${message.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redeem Codes Tab */}
          <TabsContent value="codes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Redeem Codes</CardTitle>
                <CardDescription>
                  Create new redeem codes for premium plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    createRedeemCodeMutation.mutate({
                      planId: formData.get("planId") as string,
                      duration: parseInt(formData.get("duration") as string),
                      count: parseInt(formData.get("count") as string),
                    });
                  }}
                  className="grid md:grid-cols-4 gap-4"
                >
                  <div>
                    <Label htmlFor="planId">Plan</Label>
                    <Select name="planId" required>
                      <SelectTrigger data-testid="select-plan">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {dashboardData?.plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${(plan.price / 100).toFixed(0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      name="duration"
                      type="number"
                      defaultValue="30"
                      min="1"
                      max="365"
                      required
                      data-testid="input-duration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="count">Count</Label>
                    <Input
                      name="count"
                      type="number"
                      defaultValue="1"
                      min="1"
                      max="100"
                      required
                      data-testid="input-count"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" data-testid="button-generate-codes">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unused Redeem Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.redeemCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" data-testid={`code-${code.id}`}>
                            {code.code}
                          </code>
                        </TableCell>
                        <TableCell>{code.plan?.name}</TableCell>
                        <TableCell>{code.duration} days</TableCell>
                        <TableCell>
                          {new Date(code.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(code.code)}
                            data-testid={`button-copy-${code.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}