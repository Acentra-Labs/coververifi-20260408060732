import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CoverVerifi &copy; {new Date().getFullYear()} — Mitchell Compliance Services</span>
            <span className="hidden sm:block">Insurance Compliance Verification Platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
