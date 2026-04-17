import { env } from '../config/env'
import { logger } from '../utils/logger'

const createTransport = async () => {
  if (!env.emailEnabled) {
    logger.info({ message: 'Email delivery is disabled by configuration' })
    return null
  }

  let nodemailer: any = null

  try {
    nodemailer = await import('nodemailer')
  } catch {
    logger.warn({ message: 'nodemailer is not installed; email delivery is disabled' })
    return null
  }

  if (env.googleClientId && env.googleClientSecret && env.googleRefreshToken && env.smtpUser) {
    return nodemailer.createTransport({
      host: env.smtpHost ?? 'smtp.gmail.com',
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      auth: {
        type: 'OAuth2',
        user: env.smtpUser,
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        refreshToken: env.googleRefreshToken,
        accessToken: env.googleAccessToken,
        redirectUri: env.emailRedirectUri,
      },
    })
  }

  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  }

  return null
}

export const sendVerificationCodeEmail = async (email: string, name: string, code: string): Promise<boolean> => {
  const transporter = await createTransport()

  if (!transporter) {
    if (!env.isProd) {
      logger.info({
        message: 'Development fallback: verification code generated',
        email,
        verificationCode: code,
      })
    }

    logger.warn({
      message: 'SMTP not configured; verification code email was not sent',
      email,
    })
    return false
  }

  const from = env.smtpFrom ?? env.smtpUser ?? 'noreply@example.com'

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your Expense Tracker Verification Code',
      text: `Hello ${name}, your verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${code}</strong>.</p>
        <p>This code expires in 10 minutes.</p>
      `,
    })
    return true
  } catch (error) {
    if (!env.isProd) {
      logger.info({
        message: 'Development fallback: verification code generated after delivery failure',
        email,
        verificationCode: code,
      })
    }

    logger.error({
      message: 'Verification email could not be sent',
      email,
      error,
    })
    return false
  }
}

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<boolean> => {
  const transporter = await createTransport()

  if (!transporter) {
    if (!env.isProd) {
      logger.info({
        message: 'Development fallback: password reset URL generated',
        email,
        resetUrl,
      })
    }

    logger.warn({
      message: 'SMTP not configured; password reset email was not sent',
      email,
    })
    return false
  }

  const from = env.smtpFrom ?? env.smtpUser ?? 'noreply@example.com'

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your Expense Tracker password',
      text: `Hello ${name}, reset your password using this link: ${resetUrl}. This link expires in 30 minutes.`,
      html: `
        <p>Hello ${name},</p>
        <p>Reset your password using this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    })
    return true
  } catch (error) {
    if (!env.isProd) {
      logger.info({
        message: 'Development fallback: password reset URL generated after delivery failure',
        email,
        resetUrl,
      })
    }

    logger.error({
      message: 'Password reset email could not be sent',
      email,
      error,
    })
    return false
  }
}