# Echo Learn

An AI-powered learning management system that provides personalized learning experiences through interactive AI companions. Transform your education journey with voice-enabled lessons across multiple subjects.

## Features

- **AI Learning Companions**: Create and interact with personalized AI tutors across various subjects including Mathematics, Language, Science, History, Coding, Economics

- **Voice-Enabled Sessions**: Engage in natural voice conversations with your companions using Vapi AI for an immersive learning experience

- **Personalized Learning**: Create custom companions with specific topics, teaching styles, and voice preferences

- **Session History**: Track your learning progress with detailed session history and resume previous lessons

- **Companion Library**: Browse and discover companions created by the community, with powerful search and filter capabilities

- **Subscription Management**: Flexible pricing plans with companion creation limits based on your subscription tier

- **User Profiles**: Personalized dashboards showing your learning stats, created companions, and recent sessions

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Authentication**: [Clerk](https://clerk.com)
- **Database**: [Supabase](https://supabase.com)
- **Voice AI**: [Vapi AI](https://vapi.ai)
- **UI Components**: [Radix UI](https://www.radix-ui.com) with [shadcn/ui](https://ui.shadcn.com)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Language**: TypeScript
- **Error Tracking**: [Sentry](https://sentry.io)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm, npm, or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mohammadtanim24h/echo-learn.git
cd echo-learn
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Vapi AI (Voice Integration)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token

# Sentry (Error Tracking - Optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_sentry_org_name
SENTRY_PROJECT=your_sentry_project_name
```

4. Set up your database:
   Run the SQL migrations in Supabase to create the necessary tables (`companions` and `session_history`).

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
echo-learn/
├── app/                    # Next.js app router pages
│   ├── companions/         # Companion library and session pages
│   ├── my-journey/         # User profile and learning history
│   ├── subscription/       # Pricing and subscription management
│   └── sign-in/            # Authentication pages
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── Companion.tsx       # Main companion interaction component
│   ├── CompanionCard.tsx   # Companion display card
│   └── Navbar.tsx          # Navigation bar
├── lib/                    # Utility functions and actions
│   ├── actions/            # Server actions for database operations
│   ├── supabase.ts         # Supabase client configuration
│   └── utils.ts            # Helper utilities
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Database Schema

The application uses two main tables in Supabase:

**companions**: Stores AI companion configurations

- `id`, `name`, `subject`, `topic`, `voice`, `style`, `duration`, `author`

**session_history**: Tracks user learning sessions

- `companion_id`, `user_id`, `created_at`
