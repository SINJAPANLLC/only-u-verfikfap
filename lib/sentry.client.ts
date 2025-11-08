"use client";

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
if (process.env.NEXT_PUBLIC_ENVIRONMENT !== "test" && dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2
  });
}

export const captureException = Sentry.captureException;
