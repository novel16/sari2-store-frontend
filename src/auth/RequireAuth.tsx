import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoading from '../components/ui/PageLoading'
import SessionError from './components/SessionError'
import AccessUnavailable from './components/AccessUnavailable'
import { canAccessClient } from './clientAccess'
import { safeReturnTo } from './returnTo'
import { useAuth } from './useAuth'

export default function RequireAuth() {
  const { user, isLoading, error } = useAuth()
  const location = useLocation()
  if (isLoading) return <PageLoading />
  if (error) return <SessionError />
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: safeReturnTo(`${location.pathname}${location.search}${location.hash}`) }}
      />
    )
  if (!canAccessClient(user)) return <AccessUnavailable />
  return <Outlet />
}
