import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Pages Admin
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProperties from './pages/admin/Properties'
import AdminPropertyDetail from './pages/admin/PropertyDetail'

// Pages Client/Voyageur
import GuestHome from './pages/client/GuestHome'
import GuestChat from './pages/client/GuestChat'

// Landing Page
import LandingPage from './pages/LandingPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem('oulia_token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Routes Admin */}
      <Route path="/admin/login" element={<AdminLogin setIsAuthenticated={setIsAuthenticated} />} />
      <Route
        path="/admin/dashboard"
        element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />}
      />
      <Route
        path="/admin/properties"
        element={isAuthenticated ? <AdminProperties /> : <Navigate to="/admin/login" />}
      />
      <Route
        path="/admin/properties/:id"
        element={isAuthenticated ? <AdminPropertyDetail /> : <Navigate to="/admin/login" />}
      />

      {/* Routes Client/Voyageur (publiques) */}
      <Route path="/guest/:propertyId" element={<GuestHome />} />
      <Route path="/guest/:propertyId/chat" element={<GuestChat />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
