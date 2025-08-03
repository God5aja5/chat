import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Clock, CheckCircle, XCircle, Search, Send, AlertCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

type ContactFormData = z.infer<typeof contactSchema>;

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

const categories = [
  { value: "general-inquiry", label: "General Inquiry" },
  { value: "technical-support", label: "Technical Support" },
  { value: "billing", label: "Billing & Subscriptions" },
  { value: "feature-request", label: "Feature Request" },
  { value: "bug-report", label: "Bug Report" },
  { value: "account-issue", label: "Account Issue" },
  { value: "other", label: "Other" },
];

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  replied: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function ContactPage() {
  const [trackingEmail, setTrackingEmail] = useState("");
  const [trackingTicket, setTrackingTicket] = useState("");
  const [activeTab, setActiveTab] = useState("contact");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      category: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created Successfully!",
        description: `Your support ticket ${data.ticketNumber} has been created. We'll get back to you soon.`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: userTickets, refetch: refetchUserTickets } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact/tickets", trackingEmail],
    queryFn: async () => {
      if (!trackingEmail) return [];
      const res = await apiRequest("GET", `/api/contact/tickets/${trackingEmail}`);
      return await res.json();
    },
    enabled: !!trackingEmail,
  });

  const { data: singleTicket, refetch: refetchSingleTicket } = useQuery<ContactMessage>({
    queryKey: ["/api/contact/ticket", trackingTicket],
    queryFn: async () => {
      if (!trackingTicket) return null;
      const res = await apiRequest("GET", `/api/contact/ticket/${trackingTicket}`);
      return await res.json();
    },
    enabled: !!trackingTicket,
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  const handleTrackByEmail = () => {
    if (trackingEmail) {
      refetchUserTickets();
    }
  };

  const handleTrackByTicket = () => {
    if (trackingTicket) {
      refetchSingleTicket();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Support</h1>
        <p className="text-muted-foreground">
          Get help with your account, report issues, or send us feedback
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="contact" data-testid="tab-contact">
            <Send className="h-4 w-4 mr-2" />
            Create Ticket
          </TabsTrigger>
          <TabsTrigger value="track" data-testid="tab-track">
            <Search className="h-4 w-4 mr-2" />
            Track Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      data-testid="input-name"
                      {...form.register("name")}
                      placeholder="Enter your full name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-email"
                      {...form.register("email")}
                      placeholder="Enter your email address"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    data-testid="input-subject"
                    {...form.register("subject")}
                    placeholder="Brief description of your issue"
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    data-testid="textarea-message"
                    {...form.register("message")}
                    placeholder="Please provide as much detail as possible about your issue or question"
                    rows={6}
                  />
                  {form.formState.errors.message && (
                    <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={contactMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {contactMutation.isPending ? "Creating Ticket..." : "Create Support Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="track">
          <div className="space-y-6">
            {/* Track by Email */}
            <Card>
              <CardHeader>
                <CardTitle>Track All Your Tickets</CardTitle>
                <CardDescription>
                  Enter your email address to see all support tickets you've created
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter your email address"
                    value={trackingEmail}
                    onChange={(e) => setTrackingEmail(e.target.value)}
                    data-testid="input-tracking-email"
                  />
                  <Button onClick={handleTrackByEmail} data-testid="button-track-by-email">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Track by Ticket Number */}
            <Card>
              <CardHeader>
                <CardTitle>Track Specific Ticket</CardTitle>
                <CardDescription>
                  Enter your ticket number to check the status of a specific support request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter ticket number (e.g., TKT-1234567890-ABC123)"
                    value={trackingTicket}
                    onChange={(e) => setTrackingTicket(e.target.value)}
                    data-testid="input-tracking-ticket"
                  />
                  <Button onClick={handleTrackByTicket} data-testid="button-track-by-ticket">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Tickets Results */}
            {userTickets && trackingEmail && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Support Tickets</CardTitle>
                  <CardDescription>
                    Found {userTickets.length} ticket(s) for {trackingEmail}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tickets found for this email address</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Single Ticket Result */}
            {singleTicket && trackingTicket && (
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                  <CardDescription>
                    Showing details for ticket {singleTicket.ticketNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TicketCard ticket={singleTicket} expanded />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketCard({ ticket, expanded = false }: { ticket: ContactMessage; expanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>#{ticket.ticketNumber}</span>
              <span>•</span>
              <span>{ticket.category.replace("-", " ")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
              {ticket.status === "open" && <Clock className="h-3 w-3 mr-1" />}
              {ticket.status === "in-progress" && <AlertCircle className="h-3 w-3 mr-1" />}
              {ticket.status === "replied" && <CheckCircle className="h-3 w-3 mr-1" />}
              {ticket.status === "closed" && <XCircle className="h-3 w-3 mr-1" />}
              {ticket.status.replace("-", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {(isExpanded || expanded) && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Your Message:</h4>
              <p className="text-sm bg-muted p-3 rounded">{ticket.message}</p>
            </div>
            
            {ticket.adminReply && (
              <div>
                <h4 className="font-medium mb-2">Admin Reply:</h4>
                <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded border-l-4 border-blue-500">
                  {ticket.adminReply}
                </p>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              {ticket.repliedAt && (
                <span>Replied: {new Date(ticket.repliedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      )}
      
      {!expanded && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-toggle-ticket-${ticket.id}`}
          >
            {isExpanded ? "Show Less" : "Show Details"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}