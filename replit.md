# Hawk's Path - Smart Course Selection Assistant

## Overview

Hawk's Path is a web-based academic planning tool designed to help university students plan their courses more effectively. The system provides degree requirement tracking, semester planning, prerequisite validation, course eligibility checking, and an AI-powered advisor chatbot. Students can view remaining requirements, build future semester plans, receive course recommendations, and generate advising requests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React context for UI state (theme, auth)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Build Tool**: Vite

The frontend follows a page-based structure with shared components. Main pages include Dashboard, Courses, Planner, Advisor, and Eligibility Report. Authentication state is managed through a custom `useAuth` hook that communicates with the backend session.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON APIs with `/api` prefix
- **Authentication**: Email/password auth with bcrypt password hashing and express-session (PostgreSQL-backed sessions via connect-pg-simple)
- **AI Integration**: OpenAI API (GPT-4o) for the advisor chatbot with streaming responses

The server uses a modular structure with separate files for routes, storage operations, and auth. The storage layer (`storage.ts`) provides an abstraction over database operations for courses, requirements, completed courses, semester plans, and advisor chats.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` with model-specific files in `shared/models/`
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

Key database tables:
- `users` and `sessions` - Authentication
- `courses` - Course catalog with prerequisites, credits, and categories
- `requirements` - Degree requirements by category with credit tracking
- `completed_courses` - User's completed course history
- `semester_plans` and `plan_courses` - Saved semester plans
- `advisor_chats` and `advisor_messages` - AI advisor conversation history
- `conversations` and `messages` - General chat storage

### Build and Deployment
- **Development**: `tsx` for TypeScript execution with Vite dev server
- **Production Build**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Server compiled to `dist/index.cjs`, client to `dist/public/`
- **Vercel**: `vercel.json` and `api/index.ts` entry point for serverless deployment

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- Uses `pg` driver with Drizzle ORM

### Authentication
- Email/password with bcrypt + express-session
- Requires `SESSION_SECRET` environment variable

### AI Services
- **OpenAI API**: Standard OpenAI SDK
- Requires `OPENAI_API_KEY` environment variable
- Used for advisor chatbot responses (GPT-4o with streaming)

### UI Dependencies
- Full shadcn/ui component suite (Radix UI primitives)
- Tailwind CSS for styling
- Lucide React for icons
- Embla Carousel, React Day Picker, Recharts for specialized components
