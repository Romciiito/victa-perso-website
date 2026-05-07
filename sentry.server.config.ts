import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn && !dsn.startsWith('https://your-')) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      // Server-side PII scrub: never log form bodies (REQ-NF-046, claude-rules §13).
      if (event.user) delete event.user;
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.data) {
        event.request.data = '[REDACTED]';
      }
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
}
