import { init } from '@sentry/node';

init({
  dsn: 'https://51bcd92dba1128934afd1c5726c84442@o1.ingest.us.sentry.io/4508404727283713',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.npm_package_version,
  debug: Boolean(process.env.SENTRY_DEBUG),

  tracesSampleRate: 1,
});
