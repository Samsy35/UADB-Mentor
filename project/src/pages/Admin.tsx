import { useEffect, useState } from 'react';
import { ShieldCheck, Users, Calendar, BookOpen, TrendingUp, CheckCircle2, XCircle, Clock, Plus, AlertCircle } from 'lucide-react';
import { supabase, type Profile, type Matiere } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fullName, fetchMatieres } from '@/lib/utils';

type Stats = { totalUsers: number; pendingUsers: number; validatedUsers: number; totalSessions: number; completedSessions: number; totalMatieres: number };

export default function Admin() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'validation' | 'stats' | 'matieres'>('validation');
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingUsers: 0, validatedUsers: 0, totalSessions: 0, completedSessions: 0, totalMatieres: 0 });
  const [loading, setLoading] = useState(true);
  const [newMatiere, setNewMatiere] = useState('');
  const [topMatieres, setTopMatieres] = useState<{ nom: string; count: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { if (profile?.is_admin) loadAdmin(); }, [profile]);

  const loadAdmin = async () => {
    setError('');
    const { data: pending, error: pendingError } = await supabase.from('profiles').select('*').eq('statut_validation', 'en_attente').order('created_at', { ascending: false });
    if (pendingError) {
      setError('Impossible de charger les demandes. Vérifiez que votre session administrateur est bien active.');
      setLoading(false);
      return;
    }
    setPendingUsers((pending ?? []) as Profile[]);
    const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllUsers((users ?? []) as Profile[]);
    const m = await fetchMatieres();
    setMatieres(m);
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('statut_validation', 'en_attente');
    const { count: validatedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('statut_validation', 'valide');
    const { count: totalSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
    const { count: completedSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('statut', 'terminee');
    setStats({ totalUsers: totalUsers ?? 0, pendingUsers: pendingCount ?? 0, validatedUsers: validatedCount ?? 0, totalSessions: totalSessions ?? 0, completedSessions: completedSessions ?? 0, totalMatieres: m.length });

    const { data: sessionMatieres } = await supabase.from('sessions').select('matiere:matieres(nom)');
    const counts = new Map<string, number>();
    (sessionMatieres ?? []).forEach((sm: Record<string, { nom: string }[] | { nom: string } | null>) => { const mat = sm.matiere; const nom = Array.isArray(mat) ? mat[0]?.nom : mat?.nom; if (nom) counts.set(nom, (counts.get(nom) ?? 0) + 1); });
    setTopMatieres(Array.from(counts.entries()).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    setLoading(false);
  };

  const validateUser = async (id: string, statut: 'valide' | 'suspendu') => { await supabase.from('profiles').update({ statut_validation: statut }).eq('id', id); loadAdmin(); };
  const addMatiere = async () => { if (!newMatiere.trim()) return; await supabase.from('matieres').insert({ nom: newMatiere.trim() }); setNewMatiere(''); loadAdmin(); };

  if (!profile?.is_admin) return <div className="py-20"><EmptyState icon={<AlertCircle className="w-12 h-12" />} title="Accès refusé" description="Connectez-vous avec admin@uadb.edu.sn pour ouvrir cet espace." /></div>;
  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  const tabs: { key: typeof tab; label: string; badge?: number }[] = [
    { key: 'validation', label: 'Validation comptes', badge: stats.pendingUsers },
    { key: 'stats', label: 'Statistiques' },
    { key: 'matieres', label: 'Matières' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-primary-600" /> Administration</h1>
        {error && <p className="mt-3 rounded-xl bg-error-500/10 px-4 py-3 text-sm text-error-700">{error}</p>}
        <p className="text-slate-500 mt-1">Gérez la plateforme MentorUADB</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            {t.badge ? <span className="bg-accent-500 text-white text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'validation' && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? <EmptyState icon={<CheckCircle2 className="w-12 h-12" />} title="Aucune demande en attente" description="Tous les comptes ont été traités." /> : pendingUsers.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{fullName(u)}</p>
                  <p className="text-sm text-slate-500">{u.numero_carte} · {u.telephone}</p>
                  <div className="flex gap-1.5 mt-1">{u.is_mentor && <Badge color="green">Mentor</Badge>}{u.is_mentore && <Badge color="blue">Mentoré</Badge>}</div>
                </div>
                <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => validateUser(u.id, 'valide')}><CheckCircle2 className="w-4 h-4" /> Valider</Button><Button size="sm" variant="outline" onClick={() => validateUser(u.id, 'suspendu')}><XCircle className="w-4 h-4" /> Rejeter</Button></div>
              </div>
            </Card>
          ))}
          {allUsers.length > 0 && (
            <div className="pt-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Tous les utilisateurs ({allUsers.length})</h3>
              <div className="space-y-2">{allUsers.slice(0, 20).map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
                  <Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{fullName(u)}</p><p className="text-xs text-slate-400">{u.numero_carte}</p></div>
                  <Badge color={u.statut_validation === 'valide' ? 'green' : u.statut_validation === 'en_attente' ? 'amber' : 'red'}>{u.statut_validation}</Badge>
                  {u.statut_validation === 'valide' && <Button size="sm" variant="ghost" onClick={() => validateUser(u.id, 'suspendu')}>Suspendre</Button>}
                  {u.statut_validation === 'suspendu' && <Button size="sm" variant="ghost" onClick={() => validateUser(u.id, 'valide')}>Réactiver</Button>}
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="primary" />
            <StatCard icon={Clock} label="En attente" value={stats.pendingUsers} color="amber" />
            <StatCard icon={CheckCircle2} label="Validés" value={stats.validatedUsers} color="green" />
            <StatCard icon={Calendar} label="Sessions" value={stats.totalSessions} color="secondary" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary-600" /> Sessions terminées</h3>
              <p className="text-3xl font-bold text-slate-900">{stats.completedSessions}</p>
              <p className="text-sm text-slate-500 mt-1">sur {stats.totalSessions} sessions au total{stats.totalSessions > 0 && ` (${Math.round(stats.completedSessions / stats.totalSessions * 100)}%)`}</p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary-600" /> Matières les plus demandées</h3>
              {topMatieres.length === 0 ? <p className="text-sm text-slate-400">Pas encore de données.</p> : (
                <div className="space-y-2">{topMatieres.map((m, i) => (
                  <div key={m.nom} className="flex items-center gap-3"><span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span><span className="flex-1 text-sm text-slate-700">{m.nom}</span><Badge>{m.count} session{m.count > 1 ? 's' : ''}</Badge></div>
                ))}</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'matieres' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Ajouter une matière</h3>
            <div className="flex gap-2"><Input value={newMatiere} onChange={(e) => setNewMatiere(e.target.value)} placeholder="Nom de la matière..." onKeyDown={(e) => e.key === 'Enter' && addMatiere()} /><Button onClick={addMatiere}><Plus className="w-4 h-4" /> Ajouter</Button></div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Toutes les matières ({matieres.length})</h3>
            <div className="flex flex-wrap gap-2">{matieres.map((m) => <span key={m.id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">{m.nom}</span>)}</div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = { primary: 'bg-primary-50 text-primary-600', secondary: 'bg-secondary-50 text-secondary-600', green: 'bg-success-500/10 text-success-600', amber: 'bg-accent-400/10 text-accent-600' };
  return <Card className="p-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon className="w-5 h-5" /></div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-sm text-slate-500 mt-0.5">{label}</p></Card>;
}
