import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@/components/ui';
import { UADBLogo } from '@/components/UADBLogo';
import { useToast } from '@/context/ToastContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError("Lien expiré ou invalide. Demandez un nouveau lien de réinitialisation.");
      return;
    }
    notify('Mot de passe mis à jour.', 'success');
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <UADBLogo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
          <p className="text-sm text-slate-500 mt-1">Choisissez un mot de passe sécurisé</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Nouveau mot de passe" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" />
            <Input label="Confirmer le mot de passe" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            {error && (
              <div className="flex items-center gap-2 text-sm text-error-600 bg-error-500/10 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full"><KeyRound className="w-4 h-4" /> Mettre à jour</Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
