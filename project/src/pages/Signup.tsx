import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Users, ShieldCheck, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchFilieres, fetchNiveaux, fetchUFRs } from '@/lib/utils';
import { Button, Input, Select } from '@/components/ui';
import type { Filiere, Niveau, UFR } from '@/lib/supabase';
import { UADBLogo } from '@/components/UADBLogo';

function formatSignupError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('already')) return 'Un compte existe déjà avec cette adresse email. Essayez de vous connecter.';
  if (msg.includes('password') && msg.length < 60) return err.message ?? msg;
  if (msg.includes('database error saving new user')) return 'Une erreur est survenue lors de la création du compte. Vérifiez votre niveau et votre filière.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.';
  return err.message || 'Inscription impossible pour le moment. Vérifiez vos informations et réessayez.';
}

export default function Signup() {
  const navigate = useNavigate();
  const [ufrs, setUfrs] = useState<UFR[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', numero_carte: '', telephone: '', niveau_id: '', ufr_id: '', filiere_id: '',
    is_mentor: false, is_mentore: true, bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => { Promise.all([fetchUFRs(), fetchNiveaux()]).then(([u, n]) => { setUfrs(u); setNiveaux(n); }); }, []);
  useEffect(() => { fetchFilieres(form.ufr_id || undefined).then(setFilieres).catch(() => setFilieres([])); setForm(p => ({ ...p, filiere_id: '' })); }, [form.ufr_id]);

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));
  const selectedLevel = niveaux.find(n => n.id === form.niveau_id);
  const mentorEligibleByLevel = !form.is_mentor || (selectedLevel ? selectedLevel.ordre >= 2 : false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.is_mentor && !form.is_mentore) { setError('Sélectionnez au moins un rôle.'); return; }
    if (!form.ufr_id || !form.filiere_id || !form.niveau_id) { setError('Sélectionnez votre UFR, votre filière et votre niveau.'); return; }
    if (form.is_mentor && !mentorEligibleByLevel) { setError('Un mentor doit être au minimum en L2. Votre candidature ne peut pas être soumise avec ce niveau.'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { nom: form.nom, prenom: form.prenom, numero_carte: form.numero_carte, telephone: form.telephone, niveau_id: form.niveau_id, filiere_id: form.filiere_id, is_mentor: form.is_mentor, is_mentore: form.is_mentore, bio: form.is_mentor ? form.bio : null } },
    });
    setLoading(false);
    if (err) { setError(formatSignupError(err)); return; }
    if (data.session) {
      navigate('/app');
    } else {
      setConfirmationSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="flex flex-col items-center mb-8"><UADBLogo size={64} className="mb-4" /><h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1><p className="text-sm text-slate-500 mt-1">Rejoignez la communauté MentorUADB</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {confirmationSent ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-primary-600"><MailCheck className="h-8 w-8" /></div>
              <h2 className="text-xl font-bold text-slate-900">Vérifiez votre adresse e-mail</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Votre compte a été créé. Consultez votre boîte mail et confirmez votre adresse avant de vous connecter.</p>
              {form.is_mentor && <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Votre candidature mentor restera en attente jusqu’à la validation par un administrateur.</p>}
              <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700">Aller à la connexion</Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4"><Input label="Prénom" required value={form.prenom} onChange={e=>set('prenom',e.target.value)} placeholder="Aly" /><Input label="Nom" required value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Diop" /></div>
            <div className="grid sm:grid-cols-2 gap-4"><Input label="Numéro de carte étudiante" required value={form.numero_carte} onChange={e=>set('numero_carte',e.target.value)} placeholder="UADB-2026-001" /><Input label="Téléphone" required value={form.telephone} onChange={e=>set('telephone',e.target.value)} placeholder="77 123 45 67" /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Select label="UFR / Institut *" value={form.ufr_id} onChange={e=>set('ufr_id',e.target.value)}><option value="">Sélectionner...</option>{ufrs.map(u=><option key={u.id} value={u.id}>{u.code} — {u.nom}</option>)}</Select>
              <Select label="Filière *" value={form.filiere_id} onChange={e=>set('filiere_id',e.target.value)} disabled={!form.ufr_id}><option value="">{form.ufr_id?'Sélectionner...':'Choisissez d’abord l’UFR'}</option>{filieres.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}</Select>
              <Select label="Niveau *" value={form.niveau_id} onChange={e=>set('niveau_id',e.target.value)}><option value="">Sélectionner...</option>{niveaux.map(n=><option key={n.id} value={n.id}>{n.nom}</option>)}</Select>
            </div>
            {form.is_mentor && selectedLevel && <div className={`rounded-xl px-4 py-3 text-sm ${mentorEligibleByLevel?'bg-success-500/10 text-success-700':'bg-error-500/10 text-error-700'}`}><strong>Éligibilité mentor :</strong> {mentorEligibleByLevel ? 'niveau compatible (L2 ou supérieur). Votre compte restera en attente jusqu’à validation administrative.' : 'niveau insuffisant : le mentor doit être au minimum en L2.'}</div>}
            <Input label="Email" type="email" required value={form.email} onChange={e=>set('email',e.target.value)} placeholder="votre.email@uadb.edu.sn" /><Input label="Mot de passe" type="password" required minLength={6} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="6 caractères minimum" />
            <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">Je souhaite être :</label><div className="grid grid-cols-2 gap-3"><RoleCard icon={<Users className="w-5 h-5"/>} label="Mentoré" desc="Recevoir de l'aide" active={form.is_mentore} onClick={()=>set('is_mentore',!form.is_mentore)}/><RoleCard icon={<BookOpen className="w-5 h-5"/>} label="Mentor" desc="Aider d'autres étudiants" active={form.is_mentor} onClick={()=>set('is_mentor',!form.is_mentor)}/></div></div>
            {form.is_mentor && <div className="animate-fade-in"><label className="block text-sm font-medium text-slate-700 mb-1.5">Présentation du mentor</label><textarea required value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Décrivez brièvement votre expérience..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"/></div>}
            {error && <div className="flex items-center gap-2 text-sm text-error-600 bg-error-500/10 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 shrink-0"/><span>{error}</span></div>}
            <Button type="submit" size="lg" loading={loading} className="w-full">Créer mon compte</Button>
          </form>
          )}
          {!confirmationSent && <p className="text-center text-sm text-slate-500 mt-6">Déjà inscrit ? <Link to="/login" className="text-primary-600 font-medium">Se connecter</Link></p>}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> Les candidatures mentor sont contrôlées par un administrateur.</p>
      </div>
    </div>
  );
}

function RoleCard({ icon,label,desc,active,onClick }: {icon:React.ReactNode;label:string;desc:string;active:boolean;onClick:()=>void}) {
  return <button type="button" onClick={onClick} className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left ${active?'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20':'border-slate-200 hover:border-slate-300'}`}><div className={`p-2 rounded-lg ${active?'bg-primary-600 text-white':'bg-slate-100 text-slate-500'}`}>{icon}</div><span className={`font-medium text-sm ${active?'text-primary-700':'text-slate-700'}`}>{label}</span><span className="text-xs text-slate-400">{desc}</span></button>;
}
