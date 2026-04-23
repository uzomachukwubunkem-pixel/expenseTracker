import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  companyId: string
}

interface AuthState {
  accessToken?: string
  user?: AuthUser
  rememberMe: boolean
  isBootstrapping: boolean
}

interface PersistedAuthState {
  user?: AuthUser
  rememberMe: boolean
}

interface CredentialsPayload {
  accessToken: string
  user: AuthUser
  rememberMe: boolean
}

type AuthSyncEvent = {
  type: 'logout'
  at: number
}

export const AUTH_STORAGE_KEY = 'expense-tracker-auth'
export const AUTH_SYNC_KEY = 'expense-tracker-auth-sync'

const isBrowser = typeof window !== 'undefined'

export const readPersistedState = (): PersistedAuthState | null => {
  if (!isBrowser) return null

  const fromStorage = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!fromStorage) return null

  try {
    const parsed = JSON.parse(fromStorage) as PersistedAuthState
    if (typeof parsed?.rememberMe !== 'boolean') return null
    return {
      user: parsed.user,
      rememberMe: Boolean(parsed.rememberMe),
    }
  } catch {
    return null
  }
}

const persistState = (state: AuthState) => {
  if (!isBrowser) return

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)

  const target = state.rememberMe ? window.localStorage : window.sessionStorage
  target.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      rememberMe: state.rememberMe,
    }),
  )
}

const broadcastAuthSyncEvent = (event: AuthSyncEvent) => {
  if (!isBrowser) return
  window.localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(event))
}

const clearPersistedState = (broadcast = true) => {
  if (!isBrowser) return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  if (broadcast) {
    broadcastAuthSyncEvent({ type: 'logout', at: Date.now() })
  }
}

const persistedState = readPersistedState()

const initialState: AuthState = {
  accessToken: undefined,
  user: persistedState?.user,
  rememberMe: persistedState?.rememberMe ?? false,
  isBootstrapping: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<CredentialsPayload>) => {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.rememberMe = Boolean(action.payload.rememberMe)
      state.isBootstrapping = false

      persistState(state)
    },
    clearCredentials: (state) => {
      state.accessToken = undefined
      state.user = undefined
      state.rememberMe = false
      state.isBootstrapping = false

      clearPersistedState(true)
    },
    setAccessToken: (state, action: PayloadAction<string | undefined>) => {
      state.accessToken = action.payload
    },
    setUserCompanyId: (state, action: PayloadAction<string>) => {
      if (!state.user) return
      state.user.companyId = action.payload
      persistState(state)
    },
    applyRemoteAuthState: (state, action: PayloadAction<PersistedAuthState | null>) => {
      if (!action.payload) {
        state.accessToken = undefined
        state.user = undefined
        state.rememberMe = false
        state.isBootstrapping = false
        clearPersistedState(false)
        return
      }

      state.user = action.payload.user
      state.rememberMe = Boolean(action.payload.rememberMe)
      state.accessToken = undefined
    },
    setBootstrapping: (state, action: PayloadAction<boolean>) => {
      state.isBootstrapping = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, setAccessToken, setUserCompanyId, applyRemoteAuthState, setBootstrapping } = authSlice.actions
export default authSlice.reducer
