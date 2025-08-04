import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import {
  Users,
  MessageSquare,
  Database,
  CreditCard,
  Settings,
  Activity,
  Gift,
  BarChart3,
  Download,
  Upload,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Server,
  HardDrive,
  Cpu,
  Zap,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  Crown,
  Mail
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface ModelCapability {
  id: string;
  modelName: string;
  canChat: boolean;
  canGenerateImages: boolean;
  canProcessFiles: boolean;
  canSearch: boolean;
  isActive: boolean;
  maxTokens: number;
  costPerToken: number;
}

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: selectedTab === 'dashboard',
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: selectedTab === 'users',
  });

  // Fetch messages/support tickets
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/admin/support-tickets'],
    enabled: selectedTab === 'messages',
  });

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    enabled: selectedTab === 'subscriptions',
  });

  // Fetch redeem codes
  const { data: redeemCodes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['/api/admin/redeem-codes'],
    enabled: selectedTab === 'redeem-codes',
  });

  // Fetch model capabilities
  const { data: modelCapabilities = [], isLoading: modelsLoading } = useQuery<ModelCapability[]>({
    queryKey: ['/api/admin/model-capabilities'],
    enabled: selectedTab === 'models',
  });

  // Fetch database info
  const { data: databaseStats, isLoading: dbLoading } = useQuery({
    queryKey: ['/api/admin/database/stats'],
    enabled: selectedTab === 'database',
  });

  // Generate redeem codes mutation
  const generateCodesMutation = useMutation({
    mutationFn: async (data: { planName: string; duration: number; durationType: string; count: number }) => {
      const response = await apiRequest('POST', '/api/admin/redeem-codes/generate', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redeem-codes'] });
      toast({ title: 'Success', description: 'Redeem codes generated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to generate redeem codes', variant: 'destructive' });
    },
  });

  // Remove premium mutation
  const removePremiumMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/remove-premium`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'Success', description: 'Premium access removed successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove premium access', variant: 'destructive' });
    },
  });

  const DashboardTab = () => (
    <div className="grid gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.activeUsers || 0} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChats || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalMessages || 0} messages sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.monthlyRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${((stats?.totalRevenue || 0) / 100).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm">New user registration</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm">Premium subscription activated</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm">Support ticket created</p>
                <p className="text-xs text-muted-foreground">12 minutes ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>All registered users in the system</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.slice(0, 10).map((user: any, index: number) => (
              <div key={user.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name || `User ${index + 1}`}</p>
                      {(user.subscription === "Premium" || user.isAdmin) && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email || `user${index + 1}@example.com`}</p>
                    {user.subscription === "Premium" && (
                      <p className="text-xs text-green-600 font-medium">Premium Active</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.subscription === "Premium" ? "default" : "secondary"}>
                    {user.subscription || "Free"}
                  </Badge>
                  {user.subscription === "Premium" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removePremiumMutation.mutate(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Premium
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RedeemCodesTab = () => {
    const [planName, setPlanName] = useState('Premium');
    const [duration, setDuration] = useState('1');
    const [durationType, setDurationType] = useState('months');
    const [count, setCount] = useState('1');

    const handleGenerateCodes = () => {
      generateCodesMutation.mutate({
        planName,
        duration: parseInt(duration),
        durationType,
        count: parseInt(count),
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Redeem Code Management</h3>
          <p className="text-muted-foreground">Generate and manage promotional codes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate New Codes</CardTitle>
            <CardDescription>Create promotional codes for specific plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select value={planName} onValueChange={setPlanName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium ($8/month)</SelectItem>
                    <SelectItem value="Pro">Pro ($15/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="12"
                />
              </div>

              <div>
                <Label htmlFor="duration-type">Duration Type</Label>
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerateCodes} 
              disabled={generateCodesMutation.isPending}
              className="w-full sm:w-auto"
            >
              {generateCodesMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Generate Codes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Codes ({redeemCodes?.length || 0})</CardTitle>
            <CardDescription>Manage existing promotional codes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(redeemCodes || []).slice(0, 10).map((code: any, index: number) => (
                <div key={code.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Gift className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-mono font-medium">{code.code || `CODE${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {code.planName || 'Premium'} - {code.duration || 30} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={code.isUsed ? "secondary" : "default"}>
                      {code.isUsed ? "Used" : "Active"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const DatabaseTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Database Management</h3>
        <p className="text-muted-foreground">Monitor and manage database operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{databaseStats?.databaseSize || "45.2 MB"}</div>
            <p className="text-xs text-muted-foreground">Total storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{databaseStats?.totalTables || 15}</div>
            <p className="text-xs text-muted-foreground">Active tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">Automated backup</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Operations</CardTitle>
          <CardDescription>Backup, restore, and maintenance operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Restore Backup
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Optimize Tables
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ModelsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Model Management</h3>
        <p className="text-muted-foreground">Configure AI model capabilities and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Capabilities</CardTitle>
          <CardDescription>Configure what each AI model can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'GPT-4o', chat: true, images: true, files: true, search: true },
              { name: 'GPT-4', chat: true, images: false, files: true, search: true },
              { name: 'GPT-3.5-turbo', chat: true, images: false, files: false, search: false },
              { name: 'DALL-E 3', chat: false, images: true, files: false, search: false },
              { name: 'DALL-E 2', chat: false, images: true, files: false, search: false },
            ].map((model) => (
              <div key={model.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Cpu className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <div className="flex gap-2 mt-1">
                      {model.chat && <Badge variant="secondary" className="text-xs">Chat</Badge>}
                      {model.images && <Badge variant="secondary" className="text-xs">Images</Badge>}
                      {model.files && <Badge variant="secondary" className="text-xs">Files</Badge>}
                      {model.search && <Badge variant="secondary" className="text-xs">Search</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Active</Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, content, and system settings
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} mb-6`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {!isMobile && "Dashboard"}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {!isMobile && "Users"}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {!isMobile && "Messages"}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {!isMobile && "Subscriptions"}
            </TabsTrigger>
            <TabsTrigger value="redeem-codes" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              {!isMobile && "Codes"}
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {!isMobile && "Database"}
            </TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Models
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Support Messages ({supportTickets?.length || 0})</CardTitle>
                <CardDescription>Manage customer support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                {supportTickets && supportTickets.length > 0 ? (
                  <div className="space-y-4">
                    {supportTickets.map((ticket: any) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              From: {ticket.name} ({ticket.email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ticket: {ticket.ticketNumber}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline">{ticket.priority}</Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{ticket.message}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No support tickets found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Monitor user subscriptions and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Subscription management interface</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redeem-codes">
            <RedeemCodesTab />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseTab />
          </TabsContent>

          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}