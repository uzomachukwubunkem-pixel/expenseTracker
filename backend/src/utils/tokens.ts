import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'
type Role = 'admin' | 'staff'

interface TokenPayload {
  userId: string
  email: string
  role: Role
  companyId: string
}

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] })

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'] })

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.jwtAccessSecret) as TokenPayload

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.jwtRefreshSecret) as TokenPayload

export const hashToken = async (token: string): Promise<string> => bcrypt.hash(token, 10)

export const compareTokenHash = async (token: string, hash: string): Promise<boolean> =>
  bcrypt.compare(token, hash)

export const randomId = (): string => crypto.randomUUID()
