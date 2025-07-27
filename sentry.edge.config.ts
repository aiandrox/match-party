// This file configures the initialization of Sentry for edge runtime
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",

  initialScope: {
    tags: {
      component: "edge",
    },
  },
});