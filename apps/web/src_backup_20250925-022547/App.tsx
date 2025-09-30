import { Routes, Route, Navigate } from 'react-router-dom'

// pages
import LoginPage from '@/pages/LoginPage'
import AdminPage from '@/pages/AdminPage'   // your admin (the two-column page)
import JoinPage from '@/pages/JoinPage'     // student “enter code + join” page

export default function App() {
  return (
    <Routes>
      {/* default -> login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* lecturer/admin */}
      <Route path="/dashboard" element={<AdminPage />} />

      {/* student */}
      <Route path="/join" element={<JoinPage />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}