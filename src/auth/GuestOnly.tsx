import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoading from '../components/ui/PageLoading'
import SessionError from './components/SessionError'
import AccessUnavailable from './components/AccessUnavailable'
import { canAccessClient } from './clientAccess'
import { returnToFromState } from './returnTo'
import { useAuth } from './useAuth'

export default function GuestOnly() {
  const { user, isLoading, error } = useAuth()
  const { state } = useLocation()
  if (isLoading) return <PageLoading />
  if (error) return <SessionError />
  if (user && !canAccessClient(user)) return <AccessUnavailable />
  if (user) return <Navigate to={returnToFromState(state)} replace />
  return <Outlet />
}
