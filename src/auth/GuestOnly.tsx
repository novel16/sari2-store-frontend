import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoading from '../components/ui/PageLoading'
import SessionError from './components/SessionError'
import AccessUnavailable from './components/AccessUnavailable'
import { canAccessClient } from './clientAccess'
import { authDestination } from './returnTo'
import { useAuth } from './useAuth'

export default function GuestOnly() {
  const { user, isLoading, error } = useAuth()
  const { state, search } = useLocation()
  if (isLoading) return <PageLoading />
  if (error) return <SessionError />
  if (user && !canAccessClient(user)) return <AccessUnavailable />
  if (user) return <Navigate to={authDestination(state, search)} replace />
  return <Outlet />
}
