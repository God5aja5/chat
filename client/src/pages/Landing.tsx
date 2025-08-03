import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";
import { AuthModal } from "@/components/AuthModal";
import {
  Bot,
  MessageSquare,
  Code2,
  Image as ImageIcon,
  FileText,
  Zap,
  Shield,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  ArrowRight,
  CheckCircle,
  Github,
  Twitter,
  Globe,
} from "lucide-react";

export default function Landing() {
  const { isLoading } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Advanced Chat Interface",
      description: "Stream AI responses in real-time with typing effects and smooth animations.",
    },
    {
      icon: Code2,
      title: "Code Generation & Editing",
      description: "Generate, edit, and version code with syntax highlighting and diff views.",
    },
    {
      icon: ImageIcon,
      title: "Multimodal Support",
      description: "Upload images and files, generate images with DALL-E integration.",
    },
    {
      icon: FileText,
      title: "Document Processing",
      description: "Analyze and process various file formats with intelligent responses.",
    },
    {
      icon: Zap,
      title: "Multiple AI Models",
      description: "Choose from GPT-4o, GPT-4 Turbo, GPT-4, and GPT-3.5 Turbo.",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your data stays private with local storage and secure API handling.",
    },
  ];

  const models = [
    { name: "GPT-4o", badge: "Latest", description: "Most advanced model with vision" },
    { name: "GPT-4 Turbo", badge: "Fast", description: "High performance and efficiency" },
    { name: "GPT-4", badge: "Reliable", description: "Proven accuracy and reasoning" },
    { name: "GPT-3.5 Turbo", badge: "Economic", description: "Cost-effective and quick" },
  ];

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleThemeToggle = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("auto");
    } else {
      setTheme("light");
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ChatGPT Clone</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
                {actualTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6">
                <Sparkles className="mr-2 h-3 w-3" />
                Powered by OpenAI GPT-4o
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                The Ultimate{" "}
                <span className="text-primary">ChatGPT Clone</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Experience the power of AI with our advanced ChatGPT interface. 
                Streaming responses, file uploads, code generation, and so much more.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                  Start Chatting Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </div>
            </motion.div>

            {/* Demo Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-16"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-32 bottom-0"></div>
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f8fafc'/%3E%3Crect x='0' y='0' width='250' height='600' fill='%23f1f5f9'/%3E%3Crect x='20' y='20' width='210' height='40' rx='8' fill='%2310a37f'/%3E%3Ctext x='30' y='40' font-family='system-ui' font-size='14' fill='white'%3E%2B New chat%3C/text%3E%3Crect x='20' y='80' width='210' height='60' rx='8' fill='%23e2e8f0'/%3E%3Ctext x='30' y='100' font-family='system-ui' font-size='12' fill='%23475569'%3EAdvanced React Components%3C/text%3E%3Ctext x='30' y='120' font-family='system-ui' font-size='10' fill='%2394a3b8'%3E2 hours ago%3C/text%3E%3Crect x='270' y='20' width='510' height='60' rx='8' fill='white'/%3E%3Ctext x='290' y='40' font-family='system-ui' font-size='16' font-weight='600'%3EChatGPT Clone%3C/text%3E%3Crect x='450' y='30' width='80' height='20' rx='10' fill='%23f1f5f9'/%3E%3Ctext x='460' y='42' font-family='system-ui' font-size='10' fill='%2310a37f'%3E🤖 GPT-4o%3C/text%3E%3Crect x='290' y='120' width='400' height='80' rx='12' fill='%23fefefe'/%3E%3Ctext x='310' y='140' font-family='system-ui' font-size='14'%3ECan you help me create a React component%3C/text%3E%3Ctext x='310' y='160' font-family='system-ui' font-size='14'%3Efor file upload with drag and drop?%3C/text%3E%3C/svg%3E"
                  alt="ChatGPT Clone Interface Preview"
                  className="rounded-lg border shadow-2xl w-full max-w-4xl mx-auto"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need for an advanced AI chat experience
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Models Section */}
        <section className="container py-24">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">Choose Your AI Model</h2>
              <p className="text-xl text-muted-foreground">
                Switch between different OpenAI models based on your needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {models.map((model, index) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{model.name}</h3>
                        <Badge variant="secondary">{model.badge}</Badge>
                      </div>
                      <p className="text-muted-foreground">{model.description}</p>
                      <div className="flex items-center mt-4 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Available now
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 bg-primary/5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users already experiencing the future of AI conversations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container py-12 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-6 h-6 bg-primary rounded">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ChatGPT Clone</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2025 ChatGPT Clone</span>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Authentication Modal */}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </ThemeProvider>
  );
}
