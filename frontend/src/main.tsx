import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { BuyerDashboard } from './pages/BuyerDashboard'
import { SupplierDashboard } from './pages/SupplierDashboard'
import { useAuth } from './lib/auth'
import { RFPDetail } from './pages/RFPDetail'
import { Search } from './pages/Search'
import './styles.css'

const queryClient = new QueryClient()

// Dynamic Dashboard Component
const DynamicDashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'supplier') {
    return <SupplierDashboard />;
  }
  
  return <BuyerDashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DynamicDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/buyer" element={
              <ProtectedRoute requiredRole="buyer">
                <Layout>
                  <BuyerDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/supplier" element={
              <ProtectedRoute requiredRole="supplier">
                <Layout>
                  <SupplierDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/rfp/:id" element={
              <ProtectedRoute>
                <Layout>
                  <RFPDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <Layout>
                  <Search />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
                  <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
                  <Link to="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)