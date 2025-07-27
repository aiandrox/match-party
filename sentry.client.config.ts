// This file configures the initialization of Sentry on the browser/client side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Global error handler for unhandled promise rejections
    Sentry.globalHandlersIntegration({
      onunhandledrejection: true,
      onerror: true,
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",

  beforeSend(event) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === "production") {
      // Skip certain error types that are not actionable
      if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
        return null;
      }
    }
    return event;
  },

  initialScope: {
    tags: {
      component: "client",
    },
  },
});