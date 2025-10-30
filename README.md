# Inochi

A comprehensive, community-driven workout skill database with an AI-powered chatbot to help beginners discover exercises, learn proper techniques, and build effective workout routines.

Inochi provides a curated database of exercises, skills, stretches, and mobility work—all maintained and expanded by the community. Users can submit edit suggestions through the app, which are reviewed and approved before being added to the global database. An AI chatbot powered by OpenAI helps answer exercise questions and provides technique explanations.

## Features

- **Workout, stretch and mobility exercise database** - Comprehensive database of workout skills, exercises, stretches, and mobility work
- **Community driven** - Submit edit suggestions through the app; approved changes are added to the global database
- **AI chatbot** - Get instant answers to exercise questions and detailed technique explanations

## Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (web), [React Native Expo](https://expo.dev/) (mobile)
- **Backend**: [Convex](https://convex.dev) - reactive database and server functions
- **Authentication**: [Clerk](https://clerk.dev)
- **AI**: OpenAI for chatbot functionality
- **Monorepo**: Turborepo with pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 22.21.0 or higher
- pnpm 10.20.0 or higher

### Installation

1. **Install dependencies**

```sh
pnpm install
```

2. **Configure Convex**

```sh
cd packages/backend
pnpm exec convex dev --until-success
```

This will log you into Convex (create a free account if needed) and set up your project. You'll need to add environment variables in the [Convex dashboard](https://dashboard.convex.dev):

- Configure Clerk authentication following [this guide](https://docs.convex.dev/auth/clerk)
- Add `CLERK_ISSUER_URL` from your Clerk JWT template
- Optionally add `OPENAI_API_KEY` for AI chatbot features

Make sure to enable **Google and Apple** as Social Connection providers for mobile login.

3. **Configure apps**

Create `.env.local` files in `apps/web` and `apps/native`:

- Copy `CONVEX_URL` from `packages/backend/.env.local` to `NEXT_PUBLIC_CONVEX_URL` (web) or `EXPO_PUBLIC_CONVEX_URL` (native)
- Add Clerk keys from [Clerk dashboard](https://dashboard.clerk.com/last-active?path=api-keys)

4. **Run development servers**

```sh
pnpm dev
```

This starts Convex backend, web app, and mobile app. Use ⬆ and ⬇ keys to navigate logs. To see all logs together, remove `"ui": "tui"` from `turbo.json`.

## Contributing

Inochi is open source and community-driven. We welcome contributions!

There are many ways to contribute:

- **Database content** - Submit exercise edits through the app; approved changes are added to the global database
- **Code** - Bug fixes, features, and improvements
- **AI chatbot** - Enhance responses and knowledge base
- **Documentation** - Improve guides and examples

Please see our [Contributing Guidelines](CONTRIBUTING.md) for detailed information on how to get started.

## Deploying

The app is configured for deployment on Vercel. The build command handles both Convex backend deployment and Next.js build:

```sh
cd ../../packages/backend && pnpm exec convex deploy --cmd 'cd ../../apps/web && pnpm turbo run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

A `vercel.json` file in `apps/web` contains this configuration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Important**: The name "Inochi" and the domain "inochi.app" are trademarks and may not be used by third parties to identify their own applications or services. You may use, modify, and distribute this software under the MIT License, but you must not use the "Inochi" name or branding for your own projects.

## About Convex

[Convex](https://convex.dev) powers Inochi's backend with a reactive database and serverless functions. It provides:

- **Reactive database** - Real-time updates automatically sync to all clients
- **Type-safe queries** - Full TypeScript support from database to frontend
- **Server functions** - Query, mutation, and action functions with transactional access
- **Built-in features** - File storage, search, pagination, and more

Everything scales automatically and is free to start. Learn more at [convex.dev](https://convex.dev).
