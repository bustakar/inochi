# @inochi/analytics

PostHog analytics package for the Inochi application.

## Setup (Next.js 15.3+)

For Next.js 15.3+, PostHog is initialized using the `instrumentation-client.ts|js` file at the root of your app. This is the recommended approach.

1. Add environment variables to your `.env.local`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_api_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to US instance
   ```

2. PostHog is automatically initialized in `instrumentation-client.js`:
   ```js
   import posthog from "posthog-js";

   if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
       api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
       defaults: "2025-05-24",
     });
   }
   ```

## Usage

### Client-side Tracking Events

With the instrumentation-client setup, you can import `posthog` directly from `posthog-js` anywhere in your client components:

```tsx
"use client";

import posthog from "posthog-js";

export default function MyComponent() {
  const handleClick = () => {
    posthog.capture("button_clicked", {
      button_name: "signup",
      page: "homepage",
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Identifying Users

```tsx
"use client";

import posthog from "posthog-js";

posthog.identify("user_id", {
  email: "user@example.com",
  name: "User Name",
});
```

### Setting User Properties

```tsx
"use client";

import posthog from "posthog-js";

posthog.setPersonProperties({
  plan: "premium",
  company: "Acme Inc",
});
```

### Using Feature Flags

```tsx
"use client";

import posthog from "posthog-js";

const flagValue = posthog.isFeatureEnabled("my-feature-flag");
const variant = posthog.getFeatureFlag("my-feature-flag");
```

## Server-side Usage

For server-side analytics, use the `posthog-node` package. See the [PostHog Next.js docs](https://posthog.com/docs/libraries/next-js#server-side-analytics) for details.

## Legacy Provider Approach (Next.js 15.2 and older)

If you're using Next.js 15.2 or older, you can use the `PostHogProvider` component instead. See the package exports for details.

## API Reference

See the [PostHog JavaScript SDK documentation](https://posthog.com/docs/libraries/js) for the full API reference.

## Further Reading

- [PostHog Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
- [PostHog JavaScript SDK Docs](https://posthog.com/docs/libraries/js)

