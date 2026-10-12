import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Mentors from '@/pages/Mentors';
import Sessions from '@/pages/Sessions';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import AppLayout from '@/components/AppLayout';
import AdminLayout from '@/components/AdminLayout';
import ChatbotWidget from '@/components/ChatbotWidget';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-primary-600" /></div>;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/app" replace /> : <Signup />} />
      <Route path="/app" element={<ProtectedRoute>{user ? <AdminAwareHome /> : <Navigate to="/login" replace />}</ProtectedRoute>} />
      <Route path="/app/mentors" element={<ProtectedRoute><AppLayout><Mentors /></AppLayout></ProtectedRoute>} />
      <Route path="/app/sessions" element={<ProtectedRoute><AppLayout><Sessions /></AppLayout></ProtectedRoute>} />
      <Route path="/app/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
      <Route path="/app/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/app/admin" element={<ProtectedRoute><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
      <Route path="/app/admin/users" element={<ProtectedRoute><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
      <Route path="/app/admin/catalogue" element={<ProtectedRoute><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
      <Route path="/app/admin/moderation" element={<ProtectedRoute><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AdminAwareHome() {
  const { profile } = useAuth();
  if (profile?.is_admin) return <Navigate to="/app/admin" replace />;
  return <AppLayout><Dashboard /></AppLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ChatbotWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}
