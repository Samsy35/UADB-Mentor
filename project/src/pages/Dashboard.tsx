import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, BookOpen, TrendingUp, Clock, CheckCircle2, Search, MessageSquare } from 'lucide-react';
import { supabase, type Session } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { formatDate, formatTime, fullName } from '@/lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ menteeCount: 0, mentorCount: 0, completed: 0, upcoming: 0 });

  useEffect(() => { if (profile) loadSessions(); }, [profile]);

  const loadSessions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('sessions')
      .select(`*, matiere:matieres(*), mentor:profiles!sessions_mentor_id_fkey(*), mentore:profiles!sessions_mentore_id_fkey(*)`)
      .or(`mentor_id.eq.${profile.id},mentore_id.eq.${profile.id}`)
      .order('date_session', { ascending: false })
      .limit(10);
    const s = (data ?? []) as Session[];
    setSessions(s);
    const completed = s.filter((x) => x.statut === 'terminee').length;
    const upcoming = s.filter((x) => ['demandee', 'acceptee'].includes(x.statut)).length;
    const menteeCount = new Set(s.filter((x) => x.mentor_id === profile.id).map((x) => x.mentore_id)).size;
    const mentorCount = new Set(s.filter((x) => x.mentore_id === profile.id).map((x) => x.mentor_id)).size;
    setStats({ menteeCount, mentorCount, completed, upcoming });
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  const pendingRequests = sessions.filter((s) => s.statut === 'demandee' && s.mentor_id === profile?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bonjour, {profile?.prenom} !</h1>
        <p className="text-slate-500 mt-1">Voici un aperçu de votre activité sur MentorUADB</p>
      </div>

      {profile?.statut_validation === 'en_attente' && !profile.is_admin && (
        <Card className="p-4 border-accent-400/30 bg-accent-400/5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-800">Compte en attente de validation</p>
              <p className="text-sm text-slate-500 mt-0.5">Un administrateur doit valider votre compte. Vous pouvez déjà explorer la plateforme.</p>
            </div>
          </div>
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card className="p-4 border-primary-200 bg-primary-50/50">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-600" />
            <p className="font-medium text-slate-800 flex-1">{pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} de session en attente</p>
            <Link to="/app/sessions" className="text-sm font-medium text-primary-600 hover:text-primary-700">Voir →</Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Mentorés suivis" value={stats.menteeCount} color="primary" />
        <StatCard icon={BookOpen} label="Mentors connus" value={stats.mentorCount} color="secondary" />
        <StatCard icon={CheckCircle2} label="Sessions terminées" value={stats.completed} color="green" />
        <StatCard icon={Clock} label="Sessions à venir" value={stats.upcoming} color="amber" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <QuickAction to="/app/mentors" icon={Search} label="Trouver un mentor" desc="Rechercher par matière" />
        <QuickAction to="/app/sessions" icon={Calendar} label="Mes sessions" desc="Gérer les rendez-vous" />
        <QuickAction to="/app/messages" icon={MessageSquare} label="Messagerie" desc="Discuter avec vos contacts" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-600" />Sessions récentes</h2>
          <Link to="/app/sessions" className="text-sm text-primary-600 font-medium hover:text-primary-700">Tout voir</Link>
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="Aucune session pour le moment" description="Trouvez un mentor et demandez votre première session de tutorat." />
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => {
              const other = s.mentor_id === profile?.id ? s.mentore : s.mentor;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = { primary: 'bg-primary-50 text-primary-600', secondary: 'bg-secondary-50 text-secondary-600', green: 'bg-success-500/10 text-success-600', amber: 'bg-accent-400/10 text-accent-600' };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label, desc }: { to: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 group-hover:border-primary-300 group-hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 group-hover:bg-primary-600 group-hover:text-white transition-colors"><Icon className="w-5 h-5" /></div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      </Card>
    </Link>
  );
}

function SessionStatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; color: string }> = { demandee: { label: 'Demandée', color: 'amber' }, acceptee: { label: 'Acceptée', color: 'blue' }, refusee: { label: 'Refusée', color: 'red' }, terminee: { label: 'Terminée', color: 'green' }, annulee: { label: 'Annulée', color: 'slate' } };
  const cfg = map[statut] ?? map.demandee;
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}
