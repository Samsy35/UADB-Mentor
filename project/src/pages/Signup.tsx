import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, User, BookOpen, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchFilieres, fetchNiveaux } from '@/lib/utils';
import { Button, Input, Select } from '@/components/ui';
import type { Filiere, Niveau } from '@/lib/supabase';
import { UADBLogo } from '@/components/UADBLogo';

function formatSignupError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('already') || msg.includes('already registered') || err.code === 'user_already_exists') {
    return 'Un compte existe déjà avec cette adresse email. Essayez de vous connecter.';
  }
  if (msg.includes('password') && msg.length < 60) return err.message ?? msg;
  if (msg.includes('database error saving new user')) {
    return 'Une erreur est survenue lors de la création du compte. Veuillez réessayer dans un instant.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.';
  }
  return 'Inscription impossible pour le moment. Vérifiez vos informations et réessayez.';
}

export default function Signup() {
  const navigate = useNavigate();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', numero_carte: '',
    telephone: '', niveau_id: '', filiere_id: '', is_mentor: false, is_mentore: true, bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchFilieres(), fetchNiveaux()]).then(([f, n]) => { setFilieres(f); setNiveaux(n); });
  }, []);

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.is_mentor && !form.is_mentore) { setError('Sélectionnez au moins un rôle (mentoré et/ou mentor)'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { nom: form.nom, prenom: form.prenom, numero_carte: form.numero_carte, telephone: form.telephone, is_mentor: form.is_mentor, is_mentore: form.is_mentore } },
    });
    setLoading(false);
    if (err) { setError(formatSignupError(err)); return; }
    if (form.niveau_id || form.filiere_id || form.bio) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('profiles').update({ niveau_id: form.niveau_id || null, filiere_id: form.filiere_id || null, bio: form.is_mentor ? form.bio : null }).eq('id', userData.user.id);
      }
    }
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <UADBLogo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
          <p className="text-sm text-slate-500 mt-1">Rejoignez la communauté MentorUADB</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" required value={form.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Aly" />
              <Input label="Nom" required value={form.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Diop" />
            </div>
            <Input label="Numéro de carte étudiante" required value={form.numero_carte} onChange={(e) => set('numero_carte', e.target.value)} placeholder="UADB-2026-001" />
            <Input label="Téléphone" required value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="77 123 45 67" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Niveau" value={form.niveau_id} onChange={(e) => set('niveau_id', e.target.value)}>
                <option value="">Sélectionner...</option>
                {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </Select>
              <Select label="Filière" value={form.filiere_id} onChange={(e) => set('filiere_id', e.target.value)}>
                <option value="">Sélectionner...</option>
                {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Select>
            </div>
            <Input label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="votre.email@uadb.edu.sn" />
            <Input label="Mot de passe" type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="6 caractères minimum" />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Je souhaite être :</label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard icon={<Users className="w-5 h-5" />} label="Mentoré" desc="Recevoir de l'aide" active={form.is_mentore} onClick={() => set('is_mentore', !form.is_mentore)} />
                <RoleCard icon={<BookOpen className="w-5 h-5" />} label="Mentor" desc="Aider d'autres étudiants" active={form.is_mentor} onClick={() => set('is_mentor', !form.is_mentor)} />
              </div>
            </div>
            {form.is_mentor && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Présentation (mentor)</label>
                <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Décrivez brièvement votre expérience..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-error-600 bg-error-500/10 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">Créer mon compte</Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà inscrit ? <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Se connecter</Link>
          </p>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
          <User className="w-3.5 h-3.5" /> Votre compte sera validé par un administrateur
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon, label, desc, active, onClick }: { icon: React.ReactNode; label: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left ${active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className={`p-2 rounded-lg ${active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{icon}</div>
      <span className={`font-medium text-sm ${active ? 'text-primary-700' : 'text-slate-700'}`}>{label}</span>
      <span className="text-xs text-slate-400">{desc}</span>
    </button>
  );
}
