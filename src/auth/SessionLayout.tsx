import { Outlet } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'

export default function SessionLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
