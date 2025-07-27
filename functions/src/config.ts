import {initializeApp} from 'firebase-admin/app';
import * as Sentry from '@sentry/node';

// Firebase Admin SDK を初期化
initializeApp();

// Sentry初期化
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  initialScope: {
    tags: {
      component: 'cloud-functions',
    },
  },
});