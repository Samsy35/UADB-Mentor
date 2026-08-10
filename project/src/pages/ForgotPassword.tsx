import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { UADBLogo } from '@/components/UADBLogo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setLoading(false);
    if (err) { setError("Impossible d'envoyer l'email de réinitialisation. Réessayez dans un instant."); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <UADBLogo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Recevez un lien de réinitialisation par email</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center mx-auto"><MailCheck className="w-7 h-7" /></div>
              <h2 className="font-semibold text-slate-900">Email envoyé</h2>
              <p className="text-sm text-slate-500">Si un compte existe pour {email}, vous recevrez un lien de réinitialisation valable une heure.</p>
              <Link to="/login"><Button variant="outline" className="mt-2"><ArrowLeft className="w-4 h-4" /> Retour à la connexion</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre.email@uadb.edu.sn" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-error-600 bg-error-500/10 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                </div>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full">Envoyer le lien</Button>
              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Retour à la connexion</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
