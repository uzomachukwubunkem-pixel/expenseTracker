import type { Request, Response } from 'express'
import { env } from '../config/env'
import { asyncHandler } from '../middleware/asyncHandler'
import { AppError } from '../utils/appError'
import {
  login,
  logout,
  register,
  requestPasswordReset,
  rotateRefreshToken,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode,
} from '../services/authService'

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.cookieSecure,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await register(req.body)
  res.status(201).json({ success: true, data: user })
})

export const sendVerificationCodeHandler = asyncHandler(async (req: Request, res: Response) => {
  await sendVerificationCode(req.body)
  res.json({ success: true, message: 'Verification code sent' })
})

export const verifyEmailCodeHandler = asyncHandler(async (req: Request, res: Response) => {
  await verifyEmailCode(req.body)
  res.json({ success: true, message: 'Email verified successfully' })
})

export const requestPasswordResetHandler = asyncHandler(async (req: Request, res: Response) => {
  await requestPasswordReset(req.body)
  res.json({ success: true, message: 'If the email exists, a reset link has been sent' })
})

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body)
  res.json({ success: true, message: 'Password reset successfully' })
})

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await login(req.body)
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
  res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } })
})

export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken) {
    throw new AppError('Missing refresh token', 401)
  }
  const result = await rotateRefreshToken(refreshToken)
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
  res.json({ success: true, data: { accessToken: result.accessToken } })
})

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  if (refreshToken) {
    await logout(refreshToken)
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: refreshCookieOptions.sameSite,
    secure: refreshCookieOptions.secure,
    path: refreshCookieOptions.path,
  })
  res.json({ success: true, message: 'Logged out' })
})

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user })
})
