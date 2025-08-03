import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateTicketNumber } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Bug,
  CreditCard,
  Settings,
  ArrowLeft
} from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
}

interface SubmittedTicket {
  ticketNumber: string;
  status: string;
  estimatedResponse: string;
}

const categories = [
  { value: "technical", label: "Technical Support", icon: Settings },
  { value: "billing", label: "Billing & Payments", icon: CreditCard },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: HelpCircle },
  { value: "general", label: "General Inquiry", icon: MessageSquare },
];

const priorities = [
  { value: "low", label: "Low - General question", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "medium", label: "Medium - Standard request", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "high", label: "High - Urgent issue", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  { value: "urgent", label: "Urgent - Critical problem", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "",
    priority: "medium",
  });
  
  const [submittedTicket, setSubmittedTicket] = useState<SubmittedTicket | null>(null);
  const isMobile = useIsMobile();

  const submitMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const ticketNumber = generateTicketNumber();
      const response = await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          ticketNumber,
        }),
      });
      return { ...response, ticketNumber };
    },
    onSuccess: (data) => {
      setSubmittedTicket({
        ticketNumber: data.ticketNumber,
        status: "open",
        estimatedResponse: data.priority === "urgent" ? "1-2 hours" : 
                          data.priority === "high" ? "4-6 hours" : 
                          data.priority === "medium" ? "12-24 hours" : "2-3 days"
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "",
        priority: "medium",
      });
      
      toast({
        title: "Support ticket created",
        description: `Your ticket #${data.ticketNumber} has been submitted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setSubmittedTicket(null);
  };

  if (submittedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Ticket Submitted Successfully!</CardTitle>
            <CardDescription>
              We've received your support request and will get back to you soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Ticket Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Ticket Number:</span>
                  <span className="font-mono font-medium">#{submittedTicket.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Status:</span>
                  <Badge variant="default">Open</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Estimated Response:</span>
                  <span className="font-medium">{submittedTicket.estimatedResponse}</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>You'll receive email updates about your ticket status</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={resetForm} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Submit Another Ticket
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"}
                  className="w-full"
                  data-testid="button-back-to-app"
                >
                  Back to App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Support
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Submit a support ticket and we'll help you resolve any issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create Support Ticket
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your full name"
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email"
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger data-testid="select-contact-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => {
                            const IconComponent = category.icon;
                            return (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {category.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                        <SelectTrigger data-testid="select-contact-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                      data-testid="input-contact-subject"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Please provide detailed information about your issue..."
                      rows={6}
                      required
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-ticket"
                  >
                    {submitMutation.isPending ? (
                      <>Creating ticket...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Support Ticket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Support Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorities.map((priority) => (
                    <div key={priority.value} className="flex items-center justify-between">
                      <Badge className={priority.color} variant="outline">
                        {priority.value.charAt(0).toUpperCase() + priority.value.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {priority.value === "urgent" ? "1-2 hours" :
                         priority.value === "high" ? "4-6 hours" :
                         priority.value === "medium" ? "12-24 hours" : "2-3 days"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What to Include</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Detailed description of the issue</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Steps to reproduce the problem</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Error messages or screenshots</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Your account email address</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alternative Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  For immediate assistance, check our documentation or search existing solutions.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Browse FAQ
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Community Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}