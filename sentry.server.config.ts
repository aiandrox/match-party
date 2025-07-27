// This file configures the initialization of Sentry on the server side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  integrations: [],

  // Performance Monitoring
  tracesSampleRate: 1.0,

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
      component: "server",
    },
  },
});