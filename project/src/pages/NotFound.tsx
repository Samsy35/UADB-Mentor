import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { UADBLogo } from '@/components/UADBLogo';
import { useAuth } from '@/context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-primary-50 via-white to-secondary-50 text-center">
      <UADBLogo size={64} className="mb-6" />
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <p className="text-5xl font-bold text-slate-900">404</p>
      <h1 className="text-xl font-semibold text-slate-800 mt-2">Page introuvable</h1>
      <p className="text-slate-500 mt-2 max-w-md">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <Link to={user ? '/app' : '/'} className="mt-6">
        <Button size="lg"><Home className="w-5 h-5" /> {user ? 'Retour au tableau de bord' : 'Retour à l’accueil'}</Button>
      </Link>
    </div>
  );
}
