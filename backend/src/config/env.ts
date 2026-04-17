import dotenv from 'dotenv'

dotenv.config()

const requiredVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }

  return undefined
}

const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

const parseCsv = (value: string | undefined): string[] => {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  emailEnabled:
    process.env.NODE_ENV === 'test'
      ? process.env.ALLOW_TEST_EMAILS === 'true'
      : process.env.EMAIL_ENABLED
        ? process.env.EMAIL_ENABLED === 'true'
        : true,
  port: Number(process.env.PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  corsAllowedOrigins: parseCsv(process.env.CORS_ALLOWED_ORIGINS),
  mongoUri: process.env.MONGODB_URI as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE),
  trustProxy: parseBoolean(process.env.TRUST_PROXY),
  smtpHost: readEnv('SMTP_HOST', 'EMAIL_SMTP_HOST'),
  smtpPort: Number(readEnv('SMTP_PORT', 'EMAIL_SMTP_PORT') ?? 587),
  smtpUser: readEnv('SMTP_USER', 'EMAIL_USER'),
  smtpPass: readEnv('SMTP_PASS', 'EMAIL_PASS', 'EMAIL_APP_PASSWORD'),
  smtpFrom: readEnv('SMTP_FROM', 'EMAIL_FROM'),
  googleClientId: readEnv('GOOGLE_CLIENT_ID', 'EMAIL_CLIENT_ID'),
  googleClientSecret: readEnv('GOOGLE_CLIENT_SECRET', 'EMAIL_CLIENT_SECRET'),
  googleAccessToken: readEnv('GOOGLE_ACCESS_TOKEN', 'EMAIL_ACCESS_TOKEN'),
  googleRefreshToken: readEnv('GOOGLE_REFRESH_TOKEN', 'EMAIL_REFRESH_TOKEN'),
  emailRedirectUri: readEnv('EMAIL_REDIRECT_URI', 'GOOGLE_REDIRECT_URI'),
}

if (env.isProd) {
  if (!env.cookieSecure) {
    throw new Error('COOKIE_SECURE must be true in production')
  }

  if (env.jwtAccessSecret.length < 32 || env.jwtRefreshSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters in production')
  }
}

export const isEmailVerificationConfigured = Boolean(
  (env.googleClientId && env.googleClientSecret && env.googleRefreshToken && env.smtpUser) ||
    (env.smtpHost && env.smtpUser && env.smtpPass),
)

export type EmailTransportMode = 'google-oauth2' | 'smtp-password' | 'disabled'

export const getEmailTransportMode = (): EmailTransportMode => {
  if (env.googleClientId && env.googleClientSecret && env.googleRefreshToken && env.smtpUser) {
    return 'google-oauth2'
  }

  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    return 'smtp-password'
  }

  return 'disabled'
}
