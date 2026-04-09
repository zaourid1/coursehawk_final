# Hawk's Path - WLU Course Planner

A web-based academic planning tool for Wilfrid Laurier University Computer Science students. Hawk's Path provides degree progress tracking, semester planning with CRN management, prerequisite validation, and an AI-powered academic advisor chatbot.

## Features

- **Degree Progress Tracking** - View remaining requirements by category (Core, Mathematics, Electives, General Education) with visual progress bars
- **Course Catalog** - Browse 24+ WLU CS courses with search, category filtering, and prerequisite visibility
- **Semester Planner** - Create and compare multiple term plans with CRN, professor, and schedule details
- **AI Academic Advisor** - Streaming chatbot (GPT-4o) that knows your completed courses, degree requirements, and current plan
- **Eligibility Report** - Visual summary of eligible vs. blocked courses with prerequisite path guidance

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui, Wouter |
| Backend | Express.js 5, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Email/password with bcrypt + express-session (PostgreSQL store) |
| AI | OpenAI API (GPT-4o) with SSE streaming |
| Build | Vite (client), esbuild (server) |

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** database (local, or hosted on Neon / Supabase / Railway)
- **OpenAI API key** (for the AI advisor feature)

## Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd CourseHawk

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL, session secret, and OpenAI key

# 4. Push the database schema
npm run db:push

# 5. Start the development server
npm run dev
```

The app runs at `http://localhost:5000`. On first launch, it automatically seeds 24+ courses and 4 degree requirement categories.

## Environment Variables

Create a `.env` file from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies |
| `OPENAI_API_KEY` | Yes | OpenAI API key for the advisor chatbot |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Express + Vite HMR) |
| `npm run build` | Build for production (client + server) |
| `npm run start` | Run the production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema to PostgreSQL |

## Deploying to Vercel

1. Push your code to a GitHub repository
2. Import the repository in your [Vercel dashboard](https://vercel.com/new)
3. Add environment variables (`DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`) in Project Settings > Environment Variables
4. Vercel auto-detects the build configuration from `vercel.json`
5. Deploy

The project includes a `vercel.json` that configures:
- Static client files served from `dist/public/`
- API routes handled by a serverless function (`api/index.ts`)
- SPA routing fallback for client-side navigation

> **Note:** The AI advisor uses Server-Sent Events for streaming. On Vercel's serverless platform, responses have a 30-second maximum duration. For long conversations, responses may be truncated.

## Project Structure

```
CourseHawk/
├── api/                  # Vercel serverless entry point
│   └── index.ts
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components (shadcn/ui)
│   │   ├── hooks/        # Custom React hooks (auth, toast)
│   │   ├── lib/          # Utilities (query client, helpers)
│   │   └── pages/        # Page components (6 pages)
│   └── index.html
├── server/               # Express backend
│   ├── auth/             # Authentication (session, bcrypt)
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations (Drizzle)
│   ├── db.ts             # Database connection
│   └── static.ts         # Static file serving (production)
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Drizzle ORM table definitions
│   └── models/           # Auth and chat models
├── vercel.json           # Vercel deployment config
├── drizzle.config.ts     # Drizzle Kit config
├── vite.config.ts        # Vite build config
└── tailwind.config.ts    # Tailwind CSS config
```

## Database Schema

PostgreSQL with Drizzle ORM. Tables:

- **users** / **sessions** - Authentication and session storage
- **courses** - Course catalog with prerequisites, credits, and categories
- **requirements** - Degree requirements per category per user
- **completed_courses** - User's completed course history
- **semester_plans** / **plan_courses** - Saved semester plans with CRN tracking
- **advisor_chats** / **advisor_messages** - AI advisor conversation history

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/logout` | Logout |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/courses` | All courses with eligibility |
| GET | `/api/courses/eligible` | Eligible courses only |
| GET | `/api/requirements` | Degree requirements |
| GET/POST/DELETE | `/api/completed-courses` | Completed course management |
| GET/POST/DELETE | `/api/plans` | Semester plan management |
| PATCH | `/api/plans/:id/activate` | Set active plan |
| POST/DELETE | `/api/plans/:id/courses` | Plan course management |
| GET/POST/DELETE | `/api/advisor/chats` | AI advisor chat management |
| POST | `/api/advisor/chats/:id/messages` | Send message (SSE streaming) |

## License

MIT
