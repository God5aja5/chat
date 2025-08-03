import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  MessageSquare, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreHorizontal,
  Reply,
  Eye,
  LogOut,
  Shield,
  Smartphone,
  Monitor,
  Database,
  Brain,
  Gift,
  Settings
} from "lucide-react";
import { ModelCapabilityManager } from "@/components/ModelCapabilityManager";
import { DatabaseManager } from "@/components/DatabaseManager";
import { EnhancedRedeemCodeGenerator } from "@/components/EnhancedRedeemCodeGenerator";
import { useIsMobile } from "@/hooks/use-mobile";

interface User {
  id: string;
  name: string;
  email: string;
  subscription?: {
    status: string;
    plan: {
      name: string;
      price: number;
    };
    expiresAt: string;
  };
  usage?: {
    chat: number;
    image: number;
  };
}

interface ContactMessage {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  chatLimit?: number;
  imageLimit?: number;
  isActive: boolean;
}

interface Subscription {
  id: string;
  user: {
    name: string;
    email: string;
  };
  plan: {
    name: string;
    price: number;
  };
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface RedeemCode {
  id: string;
  code: string;
  plan: {
    name: string;
  };
  duration: number;
  isUsed: boolean;
  usedBy?: {
    name: string;
    email: string;
  };
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  replied: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMobile = useIsMobile();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [selectedTicket, setSelectedTicket] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  const queryClient = useQueryClient();

  // Check for mobile screen
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Check if admin is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check");
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("Not authenticated");
      }
    };
    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/login", creds);
      return await res.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return await res.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      setCredentials({ username: "", password: "" });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: contactMessages } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/contact");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/subscriptions");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: redeemCodes } = useQuery<RedeemCode[]>({
    queryKey: ["/api/admin/redeem-codes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/redeem-codes");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, status, adminReply }: { messageId: string; status: string; adminReply: string }) => {
      const res = await apiRequest("PUT", `/api/admin/contact/${messageId}`, {
        status,
        adminReply,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact"] });
      setSelectedTicket(null);
      setReplyText("");
      setTicketStatus("");
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the user",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (credentials.username && credentials.password) {
      loginMutation.mutate(credentials);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleReply = () => {
    if (selectedTicket && replyText && ticketStatus) {
      replyMutation.mutate({
        messageId: selectedTicket.id,
        status: ticketStatus,
        adminReply: replyText,
      });
    }
  };

  const openTicket = (ticket: ContactMessage) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || "");
    setTicketStatus(ticket.status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-admin-username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter admin username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-admin-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full"
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {isMobile ? <Smartphone className="h-4 w-4 mr-1" /> : <Monitor className="h-4 w-4 mr-1" />}
                  {isMobile ? "Mobile View" : "Desktop View"}
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.openTickets || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Premium Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.premiumUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats?.monthlyRevenue || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 text-xs sm:text-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex items-center gap-1">
              <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Codes</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-1">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Models</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-1">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">New user registered</span>
                      <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Support ticket opened</span>
                      <span className="text-xs text-muted-foreground ml-auto">5m ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Premium subscription activated</span>
                      <span className="text-xs text-muted-foreground ml-auto">15m ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Status</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache</span>
                      <Badge variant="secondary">Fallback Mode</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Monitor and manage registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        {user.subscription && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.subscription.plan.name} - ${user.subscription.plan.price}/month
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={user.subscription?.status === "active" ? "default" : "secondary"}>
                          {user.subscription?.status || "Free"}
                        </Badge>
                        {user.usage && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Chat: {user.usage.chat} | Image: {user.usage.image}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  Manage customer support tickets and replies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactMessages?.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => openTicket(ticket)}
                      data-testid={`ticket-${ticket.id}`}
                    >
                      <div className="flex-1 space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {ticket.subject}
                          </h3>
                          <div className="flex gap-2">
                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                              {ticket.status}
                            </Badge>
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>#{ticket.ticketNumber} • {ticket.name} • {ticket.email}</p>
                          <p className="truncate max-w-md">{ticket.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline">
                          <Reply className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user accounts and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Plan</th>
                        <th className="text-left p-2">Usage</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            {user.subscription ? (
                              <div>
                                <p className="font-medium">{user.subscription.plan.name}</p>
                                <p className="text-sm text-gray-600">${user.subscription.plan.price}/month</p>
                              </div>
                            ) : (
                              <span className="text-gray-500">Free</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <p>Chat: {user.usage?.chat || 0}</p>
                              <p>Images: {user.usage?.image || 0}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={user.subscription?.status === "active" ? "default" : "secondary"}>
                              {user.subscription?.status || "free"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscriptions</CardTitle>
                    <CardDescription>
                      Monitor active premium subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subscriptions?.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{sub.user.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{sub.user.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {sub.plan.name} - ${sub.plan.price}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                              {sub.status}
                            </Badge>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

          {/* Codes Tab */}
          <TabsContent value="codes">
            <EnhancedRedeemCodeGenerator />
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models">
            <ModelCapabilityManager />
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <DatabaseManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply to Support Ticket</DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.ticketNumber} - {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Customer Message:</h4>
                <p className="text-sm">{selectedTicket.message}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  From: {selectedTicket.name} ({selectedTicket.email})
                  <br />
                  Category: {selectedTicket.category}
                  <br />
                  Priority: {selectedTicket.priority}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Ticket Status</Label>
                <Select value={ticketStatus} onValueChange={setTicketStatus}>
                  <SelectTrigger data-testid="select-ticket-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reply">Admin Reply</Label>
                <Textarea
                  id="reply"
                  data-testid="textarea-admin-reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  rows={6}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  onClick={handleReply}
                  disabled={replyMutation.isPending || !replyText || !ticketStatus}
                  className="flex-1"
                  data-testid="button-send-reply"
                >
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
                <Button
                  onClick={() => setSelectedTicket(null)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-reply"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}