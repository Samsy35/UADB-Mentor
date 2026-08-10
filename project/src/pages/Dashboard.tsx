import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookMarked, BookOpen, Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Search, Star,
  TrendingUp, Users, Video,
} from 'lucide-react';
import { supabase, type CompteRendu, type Evaluation, type Ressource, type Session } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, EmptyState, ProgressBar, StarRating, CardSkeleton } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';
import { formatDate, formatTime, fullName } from '@/lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (profile) load(); }, [profile]);

  const load = async () => {
    if (!profile) return;
    const [{ data: sessionsData }, { data: ressourcesData }, { data: evalsData }] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, matiere:matieres(*), mentor:profiles!sessions_mentor_id_fkey(*), mentore:profiles!sessions_mentore_id_fkey(*)')
        .or(`mentor_id.eq.${profile.id},mentore_id.eq.${profile.id}`)
        .order('date_session', { ascending: false }),
      supabase
        .from('ressources')
        .select('*, matiere:matieres(*)')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('evaluations').select('*').eq('evalue_id', profile.id).eq('masquee', false),
    ]);

    const list = (sessionsData ?? []) as Session[];
    setSessions(list);
    setRessources((ressourcesData ?? []) as Ressource[]);
    setEvaluations((evalsData ?? []) as Evaluation[]);

    const ids = list.map((s) => s.id);
    if (ids.length > 0) {
      const { data: crs } = await supabase.from('comptes_rendus').select('*').in('session_id', ids).order('created_at');
      setComptesRendus((crs ?? []) as CompteRendu[]);
    }
    setLoading(false);
  };

  if (loading) return <div className="space-y-4"><CardSkeleton count={3} /></div>;

  const isMentorView = Boolean(profile?.is_mentor);
  const today = new Date().toISOString().slice(0, 10);
  const aVenir = sessions
    .filter((s) => s.statut === 'acceptee' && s.date_session >= today)
    .sort((a, b) => (a.date_session + a.heure_debut).localeCompare(b.date_session + b.heure_debut));
  const prochaine = aVenir[0];
  const terminees = sessions.filter((s) => s.statut === 'terminee');
  const pendingRequests = sessions.filter((s) => s.statut === 'demandee' && s.mentor_id === profile?.id);
  const demandesEnvoyees = sessions.filter((s) => s.statut === 'demandee' && s.mentore_id === profile?.id);
  const menteeCount = new Set(sessions.filter((s) => s.mentor_id === profile?.id).map((s) => s.mentore_id)).size;
  const mentorCount = new Set(sessions.filter((s) => s.mentore_id === profile?.id).map((s) => s.mentor_id)).size;
  const noteMoyenne = evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + e.note, 0) / evaluations.length : 0;
  const progression = comptesRendus.filter((cr) => sessions.some((s) => s.id === cr.session_id));
  const comprehensionMoyenne = progression.length > 0
    ? progression.reduce((sum, cr) => sum + cr.niveau_comprehension, 0) / progression.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bonjour, {profile?.prenom} !</h1>
        <p className="text-slate-500 mt-1">
          {isMentorView ? 'Voici vos accompagnements et demandes en cours' : 'Voici un aperçu de votre progression sur MentorUADB'}
        </p>
      </div>

      {profile?.statut_validation === 'en_attente' && !profile.is_admin && (
        <Card className="p-4 border-accent-400/30 bg-accent-400/5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-800">Compte en attente de validation</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Un administrateur doit valider votre compte{profile.is_mentor ? ' avant que vous puissiez accompagner des étudiants' : ''}. Vous pouvez déjà explorer la plateforme.
              </p>
            </div>
          </div>
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card className="p-4 border-primary-200 bg-primary-50/50">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-600" />
            <p className="font-medium text-slate-800 flex-1">{pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} de session à traiter</p>
            <Link to="/app/sessions" className="text-sm font-medium text-primary-600 hover:text-primary-700">Voir →</Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isMentorView ? (
          <>
            <StatCard icon={Users} label="Étudiants accompagnés" value={menteeCount} color="primary" />
            <StatCard icon={Clock} label="Demandes reçues" value={pendingRequests.length} color="amber" />
            <StatCard icon={CheckCircle2} label="Séances réalisées" value={terminees.length} color="green" />
            <StatCard icon={Star} label="Note moyenne" value={noteMoyenne > 0 ? noteMoyenne.toFixed(1) : '—'} color="secondary" suffix={evaluations.length > 0 ? `${evaluations.length} avis` : 'Pas encore d’avis'} />
          </>
        ) : (
          <>
            <StatCard icon={BookOpen} label="Mentors suivis" value={mentorCount} color="primary" />
            <StatCard icon={Clock} label="Demandes en cours" value={demandesEnvoyees.length} color="amber" />
            <StatCard icon={CheckCircle2} label="Séances suivies" value={terminees.length} color="green" />
            <StatCard icon={TrendingUp} label="Compréhension" value={comprehensionMoyenne > 0 ? `${comprehensionMoyenne.toFixed(1)}/5` : '—'} color="secondary" suffix={`${progression.length} compte(s) rendu(s)`} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" />Prochaine séance</h2>
            <Link to="/app/sessions" className="text-sm text-primary-600 font-medium hover:text-primary-700">Toutes les séances</Link>
          </div>
          {prochaine ? (
            <NextSession session={prochaine} currentUserId={profile?.id ?? ''} />
          ) : (
            <EmptyState
              icon={<Calendar className="w-10 h-10" />}
              title="Aucune séance planifiée"
              description={isMentorView ? 'Vos séances acceptées apparaîtront ici.' : 'Trouvez un mentor pour planifier votre première séance.'}
            />
          )}
          {aVenir.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Ensuite</p>
              {aVenir.slice(1, 4).map((s) => {
                const other = s.mentor_id === profile?.id ? s.mentore : s.mentor;
                return (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    {other && <Avatar nom={other.nom} prenom={other.prenom} photoUrl={other.photo_url} size="sm" />}
                    <span className="flex-1 truncate text-slate-700">{s.matiere?.nom} · {other ? fullName(other) : ''}</span>
                    <span className="text-slate-400 text-xs">{formatDate(s.date_session)} · {formatTime(s.heure_debut)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary-600" />Ma progression</h2>
          {progression.length === 0 ? (
            <p className="text-sm text-slate-500">Les comptes rendus de séance alimenteront votre suivi de progression.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Compréhension moyenne</span>
                  <span className="font-medium text-slate-900">{comprehensionMoyenne.toFixed(1)}/5</span>
                </div>
                <ProgressBar value={comprehensionMoyenne} max={5} />
              </div>
              {progression.slice(-3).reverse().map((cr) => {
                const s = sessions.find((x) => x.id === cr.session_id);
                return (
                  <div key={cr.id} className="text-sm">
                    <p className="font-medium text-slate-700 truncate">{s?.matiere?.nom ?? 'Séance'}</p>
                    <p className="text-xs text-slate-500 truncate">{cr.sujet_traite}</p>
                    <ProgressBar value={cr.niveau_comprehension} max={5} className="mt-1" />
                  </div>
                );
              })}
            </div>
          )}
          {evaluations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Mes évaluations reçues</p>
              <div className="flex items-center gap-2">
                <StarRating value={noteMoyenne} size="sm" />
                <span className="text-sm text-slate-600">{noteMoyenne.toFixed(1)}/5 · {evaluations.length} avis</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction to="/app/mentors" icon={Search} label="Trouver un mentor" desc="Recherche par matière et niveau" />
        <QuickAction to="/app/sessions" icon={Calendar} label="Mes sessions" desc="Demandes et comptes rendus" />
        <QuickAction to="/app/ressources" icon={BookMarked} label="Ressources" desc="Fiches, exercices, annales" />
        <QuickAction to="/app/messages" icon={MessageSquare} label="Messagerie" desc="Discuter avec vos contacts" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-5 h-5 text-primary-600" />Activité récente</h2>
            <Link to="/app/sessions" className="text-sm text-primary-600 font-medium hover:text-primary-700">Tout voir</Link>
          </div>
          {sessions.length === 0 ? (
            <EmptyState icon={<Calendar className="w-10 h-10" />} title="Aucune session" description="Trouvez un mentor et demandez votre première séance." />
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => {
                const other = s.mentor_id === profile?.id ? s.mentore : s.mentor;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    {other && <Avatar nom={other.nom} prenom={other.prenom} photoUrl={other.photo_url} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{other ? fullName(other) : 'Session'} — {s.matiere?.nom}</p>
                      <p className="text-xs text-slate-500">{formatDate(s.date_session)} · {formatTime(s.heure_debut)}</p>
                    </div>
                    <SessionStatusBadge statut={s.statut} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><BookMarked className="w-5 h-5 text-primary-600" />Ressources récentes</h2>
            <Link to="/app/ressources" className="text-sm text-primary-600 font-medium hover:text-primary-700">Tout voir</Link>
          </div>
          {ressources.length === 0 ? (
            <EmptyState icon={<BookMarked className="w-10 h-10" />} title="Aucune ressource" description="Les mentors partageront bientôt des supports." />
          ) : (
            <div className="space-y-2">
              {ressources.map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.titre}</p>
                  <p className="text-xs text-slate-500">{r.matiere?.nom ?? 'Général'} · {r.type}</p>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function NextSession({ session, currentUserId }: { session: Session; currentUserId: string }) {
  const other = session.mentor_id === currentUserId ? session.mentore : session.mentor;
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex items-start gap-3">
        {other && <Avatar nom={other.nom} prenom={other.prenom} photoUrl={other.photo_url} size="md" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{session.matiere?.nom}</p>
          <p className="text-sm text-slate-600">{session.mentor_id === currentUserId ? 'Avec votre mentoré ' : 'Avec '}{other ? fullName(other) : ''}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(session.date_session)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />{formatTime(session.heure_debut)} - {formatTime(session.heure_fin)}</span>
            <span className="flex items-center gap-1.5">
              {session.mode === 'en_ligne' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
              {session.mode === 'en_ligne' ? 'En ligne' : 'Présentiel'}
            </span>
          </div>
          {session.sujet && <p className="text-sm text-slate-500 mt-2">{session.sujet}</p>}
        </div>
      </div>
    </div>
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

function QuickAction({ to, icon: Icon, label, desc }: { to: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 h-full group-hover:border-primary-300 group-hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 group-hover:bg-primary-600 group-hover:text-white transition-colors"><Icon className="w-5 h-5" /></div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      </Card>
    </Link>
  );
}
