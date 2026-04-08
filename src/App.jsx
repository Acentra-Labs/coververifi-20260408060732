import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import ConsultantDashboard from './pages/ConsultantDashboard';
import SubcontractorTable from './pages/SubcontractorTable';
import SubcontractorDetail from './pages/SubcontractorDetail';
import AddSubcontractor from './pages/AddSubcontractor';
import AllSubcontractors from './pages/AllSubcontractors';
import GCDashboard from './pages/GCDashboard';
import AgentVerification from './pages/AgentVerification';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'consultant' ? '/dashboard' : '/gc/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/verify/:token" element={<AgentVerification />} />

              {/* Protected routes */}
              <Route element={<MainLayout />}>
                {/* Consultant routes */}
                <Route path="/dashboard" element={<ConsultantDashboard />} />
                <Route path="/subcontractors" element={<AllSubcontractors />} />
                <Route path="/gc/:gcId/subs" element={<SubcontractorTable />} />
                <Route path="/gc/:gcId/add-sub" element={<AddSubcontractor />} />
                <Route path="/sub/:subId" element={<SubcontractorDetail />} />
                <Route path="/settings" element={<Settings />} />

                {/* GC routes */}
                <Route path="/gc/dashboard" element={<GCDashboard />} />
                <Route path="/gc/add-sub" element={<AddSubcontractor />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<RoleRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
