import { useEffect, useState } from 'react';
import {
  AlertCircle, BookOpen, Calendar, CheckCircle2, Clock, Eye, EyeOff, Flag, GraduationCap, Plus,
  ShieldCheck, Star, TrendingUp, Users, XCircle,
} from 'lucide-react';
import {
  supabase, type Evaluation, type Filiere, type Matiere, type Niveau, type Profile, type Signalement,
} from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge, Button, Card, CardSkeleton, EmptyState, Input, ProgressBar, Select, StarRating, Tabs, Textarea,
} from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fetchFilieres, fetchMatieres, fetchNiveaux, formatDate, fullName } from '@/lib/utils';

type TabKey = 'validation' | 'stats' | 'signalements' | 'evaluations' | 'referentiel';

type Stats = {
  totalUsers: number;
  pendingUsers: number;
  validatedUsers: number;
  suspendedUsers: number;
  mentors: number;
  mentores: number;
  totalSessions: number;
  completedSessions: number;
  acceptedSessions: number;
  refusedSessions: number;
  cancelledSessions: number;
  totalMatieres: number;
  totalRessources: number;
  noteMoyenne: number;
};

const EMPTY_STATS: Stats = {
  totalUsers: 0, pendingUsers: 0, validatedUsers: 0, suspendedUsers: 0, mentors: 0, mentores: 0,
  totalSessions: 0, completedSessions: 0, acceptedSessions: 0, refusedSessions: 0, cancelledSessions: 0,
  totalMatieres: 0, totalRessources: 0, noteMoyenne: 0,
};

const MOTIF_LABELS: Record<string, string> = {
  absence: 'Absence non justifiée',
  comportement: 'Comportement inapproprié',
  contenu_inapproprie: 'Contenu inapproprié',
  faux_profil: 'Faux profil',
  autre: 'Autre',
};

export default function Admin() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState<TabKey>('validation');
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [evaluations, setEvaluations] = useState<(Evaluation & { evalue?: Profile | null })[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [monthly, setMonthly] = useState<{ mois: string; count: number }[]>([]);
  const [topMatieres, setTopMatieres] = useState<{ nom: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (profile?.is_admin) loadAdmin(); }, [profile]);

  const loadAdmin = async () => {
    setError('');
    const { data: users, error: usersError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersError) {
      setError('Impossible de charger les comptes. Vérifiez que votre session administrateur est bien active.');
      setLoading(false);
      return;
    }
    const profiles = (users ?? []) as Profile[];
    setAllUsers(profiles);
    setPendingUsers(profiles.filter((u) => u.statut_validation === 'en_attente'));

    const [m, n, f] = await Promise.all([fetchMatieres(), fetchNiveaux(), fetchFilieres()]);
    setMatieres(m); setNiveaux(n); setFilieres(f);

    const [{ data: sessionsData }, { data: signalementsData }, { data: evalsData }, { count: ressourcesCount }] = await Promise.all([
      supabase.from('sessions').select('statut, created_at, matiere:matieres(nom)'),
      supabase.from('signalements').select('*, signaleur:profiles!signalements_signaleur_id_fkey(*), signale:profiles!signalements_signale_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('evaluations').select('*, evalue:profiles!evaluations_evalue_id_fkey(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('ressources').select('*', { count: 'exact', head: true }),
    ]);

    setSignalements((signalementsData ?? []) as Signalement[]);
    const evals = (evalsData ?? []) as (Evaluation & { evalue?: Profile | null })[];
    setEvaluations(evals);

    type SessionRow = { statut: string; created_at: string; matiere: { nom: string }[] | { nom: string } | null };
    const rows = (sessionsData ?? []) as SessionRow[];

    const counts = new Map<string, number>();
    const months = new Map<string, number>();
    for (const row of rows) {
      const mat = Array.isArray(row.matiere) ? row.matiere[0] : row.matiere;
      if (mat?.nom) counts.set(mat.nom, (counts.get(mat.nom) ?? 0) + 1);
      const mois = row.created_at.slice(0, 7);
      months.set(mois, (months.get(mois) ?? 0) + 1);
    }
    setTopMatieres(Array.from(counts.entries()).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    setMonthly(Array.from(months.entries()).map(([mois, count]) => ({ mois, count })).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-6));

    const visibles = evals.filter((e) => !e.masquee);
    setStats({
      totalUsers: profiles.length,
      pendingUsers: profiles.filter((u) => u.statut_validation === 'en_attente').length,
      validatedUsers: profiles.filter((u) => u.statut_validation === 'valide').length,
      suspendedUsers: profiles.filter((u) => u.statut_validation === 'suspendu').length,
      mentors: profiles.filter((u) => u.is_mentor).length,
      mentores: profiles.filter((u) => u.is_mentore).length,
      totalSessions: rows.length,
      completedSessions: rows.filter((r) => r.statut === 'terminee').length,
      acceptedSessions: rows.filter((r) => ['acceptee', 'terminee'].includes(r.statut)).length,
      refusedSessions: rows.filter((r) => r.statut === 'refusee').length,
      cancelledSessions: rows.filter((r) => r.statut === 'annulee').length,
      totalMatieres: m.length,
      totalRessources: ressourcesCount ?? 0,
      noteMoyenne: visibles.length > 0 ? visibles.reduce((sum, e) => sum + e.note, 0) / visibles.length : 0,
    });
    setLoading(false);
  };

  const updateStatut = async (id: string, statut: 'valide' | 'suspendu', message: string) => {
    const { error: err } = await supabase.from('profiles').update({ statut_validation: statut }).eq('id', id);
    if (err) { notify('Action impossible.', 'error'); return; }
    notify(message, 'success');
    loadAdmin();
  };

  const updateSignalement = async (id: string, statut: Signalement['statut']) => {
    await supabase.from('signalements').update({ statut }).eq('id', id);
    notify('Signalement mis à jour.', 'success');
    loadAdmin();
  };

  const toggleEvaluation = async (id: string, masquee: boolean) => {
    await supabase.from('evaluations').update({ masquee }).eq('id', id);
    notify(masquee ? 'Évaluation masquée.' : 'Évaluation rétablie.', 'success');
    loadAdmin();
  };

  if (!profile?.is_admin) {
    return <div className="py-20"><EmptyState icon={<AlertCircle className="w-12 h-12" />} title="Accès refusé" description="Cet espace est réservé aux administrateurs." /></div>;
  }
  if (loading) return <CardSkeleton count={4} />;

  const signalementsOuverts = signalements.filter((s) => s.statut === 'ouvert').length;
  const tauxAcceptation = stats.totalSessions > 0 ? Math.round((stats.acceptedSessions / stats.totalSessions) * 100) : 0;
  const tauxAnnulation = stats.totalSessions > 0 ? Math.round((stats.cancelledSessions / stats.totalSessions) * 100) : 0;
  const maxMois = Math.max(1, ...monthly.map((m) => m.count));

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'validation', label: 'Comptes', badge: stats.pendingUsers },
    { key: 'stats', label: 'Statistiques' },
    { key: 'signalements', label: 'Signalements', badge: signalementsOuverts },
    { key: 'evaluations', label: 'Évaluations' },
    { key: 'referentiel', label: 'Référentiel' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-primary-600" /> Administration</h1>
        <p className="text-slate-500 mt-1">Supervisez les comptes, les accompagnements et la qualité de la plateforme</p>
        {error && <p className="mt-3 rounded-xl bg-error-500/10 px-4 py-3 text-sm text-error-700">{error}</p>}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'validation' && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="w-12 h-12" />} title="Aucune demande en attente" description="Tous les comptes ont été traités." />
          ) : pendingUsers.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{fullName(u)}</p>
                  <p className="text-sm text-slate-500">{u.numero_carte} · {u.telephone}</p>
                  {u.experience && <p className="text-sm text-slate-500 mt-1">Expérience : {u.experience}</p>}
                  <div className="flex gap-1.5 mt-1">
                    {u.is_mentor && <Badge color="green">Mentor</Badge>}
                    {u.is_mentore && <Badge color="blue">Mentoré</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateStatut(u.id, 'valide', 'Compte validé.')}><CheckCircle2 className="w-4 h-4" /> Valider</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatut(u.id, 'suspendu', 'Compte rejeté.')}><XCircle className="w-4 h-4" /> Rejeter</Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="pt-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Tous les utilisateurs ({allUsers.length})</h3>
            <div className="space-y-2">
              {allUsers.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
                  <Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{fullName(u)}</p>
                    <p className="text-xs text-slate-400">{u.numero_carte}</p>
                  </div>
                  <Badge color={u.statut_validation === 'valide' ? 'green' : u.statut_validation === 'en_attente' ? 'amber' : 'red'}>{u.statut_validation}</Badge>
                  {u.statut_validation === 'valide' && <Button size="sm" variant="ghost" onClick={() => updateStatut(u.id, 'suspendu', 'Compte suspendu.')}>Suspendre</Button>}
                  {u.statut_validation !== 'valide' && <Button size="sm" variant="ghost" onClick={() => updateStatut(u.id, 'valide', 'Compte réactivé.')}>Réactiver</Button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="primary" suffix={`${stats.mentors} mentors · ${stats.mentores} mentorés`} />
            <StatCard icon={Clock} label="En attente" value={stats.pendingUsers} color="amber" suffix={`${stats.suspendedUsers} suspendu(s)`} />
            <StatCard icon={Calendar} label="Séances" value={stats.totalSessions} color="secondary" suffix={`${stats.completedSessions} terminée(s)`} />
            <StatCard icon={Star} label="Note moyenne" value={stats.noteMoyenne > 0 ? stats.noteMoyenne.toFixed(1) : '—'} color="green" suffix="sur les mentors" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RateCard label="Taux d'acceptation" value={tauxAcceptation} />
            <RateCard label="Taux d'annulation" value={tauxAnnulation} />
            <StatCard icon={BookOpen} label="Matières" value={stats.totalMatieres} color="primary" />
            <StatCard icon={GraduationCap} label="Ressources" value={stats.totalRessources} color="secondary" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary-600" /> Évolution des accompagnements</h3>
              {monthly.length === 0 ? <p className="text-sm text-slate-400">Pas encore de données.</p> : (
                <div className="flex items-end gap-3 h-40">
                  {monthly.map((m) => (
                    <div key={m.mois} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">{m.count}</span>
                      <div className="w-full bg-primary-100 rounded-t-lg" style={{ height: `${(m.count / maxMois) * 100}%`, minHeight: '4px' }}>
                        <div className="w-full h-full bg-primary-600 rounded-t-lg opacity-80" />
                      </div>
                      <span className="text-xs text-slate-400">{m.mois.slice(5)}/{m.mois.slice(2, 4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary-600" /> Matières les plus demandées</h3>
              {topMatieres.length === 0 ? <p className="text-sm text-slate-400">Pas encore de données.</p> : (
                <div className="space-y-3">
                  {topMatieres.map((m, i) => (
                    <div key={m.nom}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span>
                        <span className="flex-1 text-sm text-slate-700">{m.nom}</span>
                        <Badge>{m.count} séance{m.count > 1 ? 's' : ''}</Badge>
                      </div>
                      <ProgressBar value={m.count} max={topMatieres[0].count} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'signalements' && (
        <div className="space-y-3">
          {signalements.length === 0 ? (
            <EmptyState icon={<Flag className="w-12 h-12" />} title="Aucun signalement" description="Les signalements des utilisateurs apparaîtront ici." />
          ) : signalements.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-500/10 text-error-600 flex items-center justify-center shrink-0"><Flag className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{MOTIF_LABELS[s.motif] ?? s.motif}</p>
                  <p className="text-sm text-slate-500">
                    {s.signaleur ? fullName(s.signaleur) : 'Utilisateur'} → {s.signale ? fullName(s.signale) : 'Utilisateur'} · {formatDate(s.created_at)}
                  </p>
                  {s.description && <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{s.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={s.statut === 'ouvert' ? 'amber' : s.statut === 'resolu' ? 'green' : s.statut === 'rejete' ? 'slate' : 'blue'}>{s.statut}</Badge>
                  {s.statut !== 'resolu' && <Button size="sm" variant="secondary" onClick={() => updateSignalement(s.id, 'resolu')}>Résoudre</Button>}
                  {s.statut === 'ouvert' && <Button size="sm" variant="outline" onClick={() => updateSignalement(s.id, 'en_cours')}>Prendre en charge</Button>}
                  {s.statut !== 'rejete' && <Button size="sm" variant="ghost" onClick={() => updateSignalement(s.id, 'rejete')}>Rejeter</Button>}
                  {s.signale && s.signale.statut_validation !== 'suspendu' && (
                    <Button size="sm" variant="danger" onClick={() => updateStatut(s.signale!.id, 'suspendu', 'Compte suspendu.')}>Suspendre le compte</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'evaluations' && (
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <EmptyState icon={<Star className="w-12 h-12" />} title="Aucune évaluation" description="Les évaluations laissées par les étudiants apparaîtront ici." />
          ) : evaluations.map((e) => (
            <Card key={e.id} className={`p-4 ${e.masquee ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StarRating value={e.note} size="sm" />
                    <span className="text-sm text-slate-600">{e.note}/5</span>
                    <span className="text-sm text-slate-400">· {e.evalue ? fullName(e.evalue) : 'Mentor'}</span>
                    {e.masquee && <Badge color="red">Masquée</Badge>}
                  </div>
                  {e.commentaire && <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{e.commentaire}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDate(e.created_at)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleEvaluation(e.id, !e.masquee)}>
                  {e.masquee ? <><Eye className="w-4 h-4" /> Rétablir</> : <><EyeOff className="w-4 h-4" /> Masquer</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'referentiel' && (
        <Referentiel matieres={matieres} niveaux={niveaux} filieres={filieres} onChange={loadAdmin} />
      )}
    </div>
  );
}

function Referentiel({ matieres, niveaux, filieres, onChange }: {
  matieres: Matiere[];
  niveaux: Niveau[];
  filieres: Filiere[];
  onChange: () => void;
}) {
  const { notify } = useToast();
  const [matiere, setMatiere] = useState({ nom: '', code: '', description: '', niveau_id: '', filiere_id: '' });
  const [niveau, setNiveau] = useState({ nom: '', code: '', ordre: '' });
  const [filiere, setFiliere] = useState({ nom: '', code: '' });
  const [saving, setSaving] = useState(false);

  const addMatiere = async () => {
    if (!matiere.nom.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('matieres').insert({
      nom: matiere.nom.trim(),
      code: matiere.code.trim() || null,
      description: matiere.description.trim() || null,
      niveau_id: matiere.niveau_id || null,
      filiere_id: matiere.filiere_id || null,
    });
    setSaving(false);
    if (error) { notify('Ajout impossible.', 'error'); return; }
    setMatiere({ nom: '', code: '', description: '', niveau_id: '', filiere_id: '' });
    notify('Matière ajoutée.', 'success');
    onChange();
  };

  const addNiveau = async () => {
    if (!niveau.nom.trim() || !niveau.code.trim()) return;
    const { error } = await supabase.from('niveaux').insert({
      nom: niveau.nom.trim(),
      code: niveau.code.trim(),
      ordre: niveau.ordre ? Number(niveau.ordre) : niveaux.length + 1,
    });
    if (error) { notify('Ajout impossible.', 'error'); return; }
    setNiveau({ nom: '', code: '', ordre: '' });
    notify('Niveau ajouté.', 'success');
    onChange();
  };

  const addFiliere = async () => {
    if (!filiere.nom.trim() || !filiere.code.trim()) return;
    const { error } = await supabase.from('filieres').insert({ nom: filiere.nom.trim(), code: filiere.code.trim() });
    if (error) { notify('Ajout impossible.', 'error'); return; }
    setFiliere({ nom: '', code: '' });
    notify('Filière ajoutée.', 'success');
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Ajouter une matière</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Intitulé *" value={matiere.nom} onChange={(e) => setMatiere({ ...matiere, nom: e.target.value })} placeholder="Algorithmique" />
          <Input label="Code" value={matiere.code} onChange={(e) => setMatiere({ ...matiere, code: e.target.value })} placeholder="INF201" />
          <Select label="Niveau" value={matiere.niveau_id} onChange={(e) => setMatiere({ ...matiere, niveau_id: e.target.value })}>
            <option value="">Tous les niveaux</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </Select>
          <Select label="Filière / UFR" value={matiere.filiere_id} onChange={(e) => setMatiere({ ...matiere, filiere_id: e.target.value })}>
            <option value="">Toutes les filières</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </div>
        <Textarea label="Description" rows={2} value={matiere.description} onChange={(e) => setMatiere({ ...matiere, description: e.target.value })} />
        <Button onClick={addMatiere} loading={saving}><Plus className="w-4 h-4" /> Ajouter la matière</Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Matières ({matieres.length})</h3>
        <div className="flex flex-wrap gap-2">
          {matieres.map((m) => (
            <span key={m.id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">
              {m.code && <span className="text-xs text-slate-400">{m.code}</span>}{m.nom}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Niveaux ({niveaux.length})</h3>
          <div className="flex flex-wrap gap-2">
            {niveaux.map((n) => <span key={n.id} className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">{n.nom}</span>)}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Nom" value={niveau.nom} onChange={(e) => setNiveau({ ...niveau, nom: e.target.value })} placeholder="Licence 2" />
            <Input label="Code" value={niveau.code} onChange={(e) => setNiveau({ ...niveau, code: e.target.value })} placeholder="L2" />
            <Input label="Ordre" type="number" value={niveau.ordre} onChange={(e) => setNiveau({ ...niveau, ordre: e.target.value })} placeholder="2" />
          </div>
          <Button variant="outline" onClick={addNiveau}><Plus className="w-4 h-4" /> Ajouter un niveau</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Filières ({filieres.length})</h3>
          <div className="flex flex-wrap gap-2">
            {filieres.map((f) => <span key={f.id} className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">{f.nom}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nom" value={filiere.nom} onChange={(e) => setFiliere({ ...filiere, nom: e.target.value })} placeholder="Informatique" />
            <Input label="Code" value={filiere.code} onChange={(e) => setFiliere({ ...filiere, code: e.target.value })} placeholder="INFO" />
          </div>
          <Button variant="outline" onClick={addFiliere}><Plus className="w-4 h-4" /> Ajouter une filière</Button>
        </Card>
      </div>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}%</p>
      <ProgressBar value={value} className="mt-2" />
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, color, suffix }: { icon: React.ElementType; label: string; value: number | string; color: string; suffix?: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    green: 'bg-success-500/10 text-success-600',
    amber: 'bg-accent-400/10 text-accent-600',
  };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {suffix && <p className="text-xs text-slate-400 mt-0.5">{suffix}</p>}
    </Card>
  );
}
