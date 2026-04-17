import { useEffect } from 'react'
import './App.css'
import {
  AUTH_STORAGE_KEY,
  AUTH_SYNC_KEY,
  applyRemoteAuthState,
  readPersistedState,
  setBootstrapping,
  setCredentials,
} from './features/auth/authSlice'
import { useLazyMeQuery, useRefreshMutation } from './features/auth/authApi'
import { useAppDispatch } from './hooks/redux'
import { AppRouter } from './routes/AppRouter'

function App() {
  const dispatch = useAppDispatch()
  const [refresh] = useRefreshMutation()
  const [loadMe] = useLazyMeQuery()

  useEffect(() => {
    const bootstrapSession = async () => {
      dispatch(setBootstrapping(true))

      try {
        const refreshResponse = await refresh().unwrap()
        const meResponse = await loadMe().unwrap()
        const rememberPreference = readPersistedState()?.rememberMe ?? false

        dispatch(
          setCredentials({
            accessToken: refreshResponse.data.accessToken,
            user: meResponse.data,
            rememberMe: rememberPreference,
          }),
        )
      } catch {
        dispatch(applyRemoteAuthState(null))
      } finally {
        dispatch(setBootstrapping(false))
      }
    }

    void bootstrapSession()
  }, [dispatch, loadMe, refresh])

  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === AUTH_SYNC_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as { type?: string }
          if (parsed.type === 'logout') {
            dispatch(applyRemoteAuthState(null))
          }
        } catch {
          dispatch(applyRemoteAuthState(null))
        }
        return
      }

      if (event.key === AUTH_STORAGE_KEY) {
        const persistedState = readPersistedState()
        dispatch(applyRemoteAuthState(persistedState))
      }
    }

    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [dispatch])

  return <AppRouter />
}

export default App
