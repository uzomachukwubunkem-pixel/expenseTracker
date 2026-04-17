import { api } from '../../app/api'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: 'admin' | 'staff'
  companyId?: string
}

interface SendVerificationCodeRequest {
  email: string
}

interface RequestPasswordResetRequest {
  email: string
}

interface ResetPasswordRequest {
  email: string
  token: string
  password: string
}

interface VerifyEmailCodeRequest {
  email: string
  code: string
}

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  companyId: string
}

interface LoginResponse {
  success: boolean
  data: {
    accessToken: string
    user: AuthUser
  }
}

interface RefreshResponse {
  success: boolean
  data: {
    accessToken: string
  }
}

interface MeResponse {
  success: boolean
  data: AuthUser
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<{ success: boolean; data: unknown }, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    sendVerificationCode: builder.mutation<
      { success: boolean; message: string },
      SendVerificationCodeRequest
    >({
      query: (body) => ({
        url: '/auth/send-verification-code',
        method: 'POST',
        body,
      }),
    }),
    verifyEmailCode: builder.mutation<{ success: boolean; message: string }, VerifyEmailCodeRequest>({
      query: (body) => ({
        url: '/auth/verify-email-code',
        method: 'POST',
        body,
      }),
    }),
    requestPasswordReset: builder.mutation<{ success: boolean; message: string }, RequestPasswordResetRequest>({
      query: (body) => ({
        url: '/auth/request-password-reset',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    refresh: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    me: builder.query<MeResponse, void>({
      query: () => '/auth/me',
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useSendVerificationCodeMutation,
  useVerifyEmailCodeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useLoginMutation,
  useRefreshMutation,
  useMeQuery,
  useLazyMeQuery,
  useLogoutMutation,
} = authApi
