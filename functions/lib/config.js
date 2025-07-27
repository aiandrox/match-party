"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const Sentry = require("@sentry/node");
// Firebase Admin SDK を初期化
(0, app_1.initializeApp)();
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
//# sourceMappingURL=config.js.map