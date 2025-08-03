# ChatGPT Clone Web Application

## Overview

This is a complete ChatGPT clone web application built with a modern full-stack architecture. The application provides a sophisticated chat interface with AI-powered conversations, real-time message streaming, file uploads, model selection, and comprehensive user management. The project is designed to replicate the core functionality and user experience of ChatGPT, including features like chat history, dark/light mode, message actions, and user settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Premium Features Implementation
- **Premium Subscription System**: Added comprehensive premium plans ($8 Basic, $15 Pro) with usage tracking and limits
- **Admin Panel**: Complete admin dashboard with user management, subscription tracking, and contact message handling
- **Contact System**: Full contact form with admin reply functionality and email integration
- **Redeem Code System**: Generate and manage redeem codes for promotional campaigns
- **DALL-E Integration**: Added image generation support with automatic detection and usage tracking
- **Enhanced Settings**: Added image model selection (DALL-E 3/2) and premium feature controls

### Database Schema Updates
- Added premium plans, subscriptions, contact messages, admin users, and redeem codes tables
- Implemented usage tracking for both chat and image generation
- Added proper relationships and constraints for data integrity

### New Pages and Components
- `/pricing` - Premium plan pricing page with subscription management
- `/contact` - Contact form with category selection and admin integration  
- `/admin` - Administrative dashboard with analytics and management tools
- Enhanced sidebar with premium features access (upgrade, contact, redeem codes)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React patterns
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: React Query (TanStack Query) for server state and custom React Context for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript for type safety across the entire stack
- **API Design**: RESTful API with WebSocket support for real-time features
- **File Handling**: Multer middleware for file uploads with type validation and size limits
- **Development**: Hot module replacement and error overlay for development experience

### Database & Storage
- **Database**: PostgreSQL with Neon serverless database hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Centralized schema definitions in shared directory
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Authentication & Authorization
- **Provider**: Replit Authentication (OIDC-based) for seamless integration
- **Session Management**: Express sessions with PostgreSQL persistence
- **Security**: Secure cookie configuration with HTTPS and session timeout

### AI Integration
- **Provider**: OpenAI API for chat completions
- **Streaming**: Real-time response streaming with token-by-token display
- **Model Support**: Multiple OpenAI models (GPT-4o, GPT-4, GPT-3.5-turbo) with user selection
- **Error Handling**: Comprehensive error handling for API failures and rate limits

### Real-time Features
- **Message Streaming**: Server-sent events for real-time AI response streaming
- **WebSocket Support**: Infrastructure for real-time features like typing indicators
- **Optimistic Updates**: Immediate UI updates with server reconciliation

### File Management
- **Upload Support**: Multiple file types including images, documents, and text files
- **Validation**: File type and size validation on both client and server
- **Storage**: Local file system storage with database metadata tracking
- **Preview**: Client-side file preview for images and text files

### UI/UX Architecture
- **Theme System**: Light/dark/auto mode with system preference detection
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: ARIA compliance through Radix UI primitives
- **Loading States**: Skeleton loaders and streaming indicators for better UX
- **Error Boundaries**: Graceful error handling with user-friendly messages

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form for form management
- **TypeScript**: Full TypeScript implementation for type safety
- **Vite**: Build tool with React plugin and development optimizations

### UI & Styling
- **Shadcn/ui**: Complete UI component library built on Radix UI
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Framer Motion**: Animation library for smooth transitions

### Backend Framework
- **Express.js**: Web application framework for Node.js
- **OpenID Connect**: Authentication via openid-client for Replit Auth
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **Express Session**: Session management with PostgreSQL store

### Database & ORM
- **Drizzle ORM**: Type-safe ORM for PostgreSQL with migration support
- **Neon Database**: Serverless PostgreSQL database hosting
- **PostgreSQL**: Primary database with WebSocket support via ws library

### AI & External APIs
- **OpenAI**: Official OpenAI SDK for chat completions and streaming
- **API Integration**: RESTful API design with proper error handling

### Development & Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution engine for development
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### State Management & Data Fetching
- **TanStack React Query**: Server state management with caching and synchronization
- **React Context**: Local state management for theme and chat context

### Utility Libraries
- **Zod**: Schema validation for API requests and responses
- **Date-fns**: Date manipulation and formatting
- **Clsx & Tailwind Merge**: Conditional CSS class management
- **Class Variance Authority**: Type-safe component variants

### File Handling & Media
- **Multer**: File upload middleware with validation
- **React Syntax Highlighter**: Code syntax highlighting with Prism themes
- **React Markdown**: Markdown rendering for AI responses

### Development Experience
- **Replit Integration**: Replit-specific plugins for development environment
- **Runtime Error Modal**: Development error overlay for debugging
- **Hot Module Replacement**: Fast refresh for development productivity