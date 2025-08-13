# Groovia - Collaborative Music Streaming Platform

## Overview

Groovia is a real-time collaborative music streaming platform that allows users to create shared music rooms, build playlists together, and vote on songs democratically. The application features synchronized playback, real-time queue management, and social features for music discovery and sharing.

The platform is built as a full-stack web application with a React frontend and Express.js backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for the main UI framework
- Vite as the build tool and development server
- TanStack Query for server state management and API caching
- Wouter for lightweight client-side routing
- Tailwind CSS for styling with custom design system
- Shadcn/ui component library for consistent UI components

**Key Design Decisions:**
- Component-based architecture with reusable UI components
- Custom glass-morphism design system with animated gradients
- Responsive design supporting both desktop and mobile interfaces
- Real-time state synchronization using React Query's caching layer
- Form validation using React Hook Form with Zod schemas

**Frontend Structure:**
- `/client/src/pages/` - Main application pages (landing, room, auth, profile)
- `/client/src/components/` - Reusable React components
- `/client/src/components/ui/` - Shadcn/ui component library
- `/client/src/lib/` - Utility functions and API client
- `/client/src/hooks/` - Custom React hooks

### Backend Architecture

**Technology Stack:**
- Express.js as the web server framework
- TypeScript for type safety
- Drizzle ORM for database operations
- PostgreSQL as the primary database
- Zod for request/response validation
- Memory-based storage implementation with database interface

**API Design:**
- RESTful API endpoints organized by feature domains
- Consistent error handling and response formatting
- Request logging and performance monitoring
- CORS configuration for cross-origin requests

**Backend Structure:**
- `/server/index.ts` - Main Express server setup
- `/server/routes.ts` - API route definitions
- `/server/storage.ts` - Data access layer with interface abstraction
- `/server/vite.ts` - Development server integration

### Database Schema

**Core Entities:**
- **Users** - User accounts with authentication and profile data
- **Rooms** - Music rooms with unique codes and metadata
- **Songs** - Track information with external service integration
- **Queue Items** - Songs in room queues with voting and ordering
- **Votes** - User votes on queue items for democratic playlist curation
- **Room Members** - Many-to-many relationship between users and rooms

**Database Features:**
- UUID primary keys for all entities
- Timestamp tracking for audit trails
- Referential integrity with foreign key constraints
- Indexed fields for performance optimization

### Shared Types and Validation

**Schema Management:**
- Centralized type definitions in `/shared/schema.ts`
- Drizzle ORM schema definitions with Zod validation
- Type-safe database operations and API contracts
- Shared validation schemas between frontend and backend

## External Dependencies

### Database Services
- **PostgreSQL** - Primary database for persistent data storage
- **Neon Database** - Cloud PostgreSQL provider (via @neondatabase/serverless)
- **Drizzle ORM** - Type-safe database toolkit and query builder

### UI and Styling
- **Radix UI** - Headless component library for accessibility
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library for consistent iconography
- **Class Variance Authority** - Component variant management

### Development Tools
- **Vite** - Fast build tool and development server
- **TypeScript** - Static type checking
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** - CSS processing with Tailwind integration

### External APIs and Integrations
- **YouTube API** - Planned integration for music streaming (external service placeholders exist)
- **Spotify API** - Planned integration for music catalog access
- **Social Authentication** - Prepared for OAuth integration

### Deployment and Infrastructure
- **Replit** - Development and hosting platform
- **Express Session Management** - User session handling
- **CORS** - Cross-origin resource sharing configuration

The application is designed to be easily deployable on various platforms with minimal configuration changes, using environment variables for service connections and API keys.