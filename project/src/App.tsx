import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Landing from '@/pages/Landing';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Mentors from '@/pages/Mentors';
import Sessions from '@/pages/Sessions';
import Messages from '@/pages/Messages';
import Ressources from '@/pages/Ressources';
import NotificationsPage from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import AppLayout from '@/components/AppLayout';
import ChatbotWidget from '@/components/ChatbotWidget';

function FullPageSpinner() {
  return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-primary-600" /></div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/app" replace /> : <Signup />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/app/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
      <Route path="/app/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/app/ressources" element={<ProtectedRoute><Ressources /></ProtectedRoute>} />
      <Route path="/app/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/app/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/app/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <NotificationProvider>
            <AppRoutes />
            <ChatbotWidget />
          </NotificationProvider>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
