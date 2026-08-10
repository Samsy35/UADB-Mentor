import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Video, MapPin, Clock, CheckCircle2, XCircle, MessageSquare, Star, Inbox } from 'lucide-react';
import { supabase, type Session, type Evaluation } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, EmptyState, Spinner, Textarea } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { formatDate, formatTime, fullName } from '@/lib/utils';

export default function Sessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'toutes' | 'demandees' | 'avenir' | 'terminees'>('toutes');

  useEffect(() => { if (profile) loadSessions(); }, [profile]);

  const loadSessions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('sessions')
      .select(`*, matiere:matieres(*), mentor:profiles!sessions_mentor_id_fkey(*), mentore:profiles!sessions_mentore_id_fkey(*)`)
      .or(`mentor_id.eq.${profile.id},mentore_id.eq.${profile.id}`)
      .order('date_session', { ascending: false });
    setSessions((data ?? []) as Session[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    switch (tab) {
      case 'demandees': return sessions.filter((s) => s.statut === 'demandee');
      case 'avenir': return sessions.filter((s) => ['demandee', 'acceptee'].includes(s.statut));
      case 'terminees': return sessions.filter((s) => ['terminee', 'refusee', 'annulee'].includes(s.statut));
      default: return sessions;
    }
  }, [sessions, tab]);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'demandees', label: 'Demandes reçues' },
    { key: 'avenir', label: 'À venir' },
    { key: 'terminees', label: 'Terminées' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes sessions</h1>
        <p className="text-slate-500 mt-1">Gérez vos sessions de tutorat</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="w-12 h-12" />} title="Aucune session" description="Vous n'avez pas de session dans cette catégorie." action={<Link to="/app/mentors"><Button>Trouver un mentor</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => <SessionCard key={s.id} session={s} currentUserId={profile?.id ?? ''} onRefresh={loadSessions} />)}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, currentUserId, onRefresh }: { session: Session; currentUserId: string; onRefresh: () => void }) {
  const [showEval, setShowEval] = useState(false);
  const [evalNote, setEvalNote] = useState(5);
  const [evalComment, setEvalComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingEval, setExistingEval] = useState<Evaluation | null>(null);

  const isMentor = session.mentor_id === currentUserId;
  const other = isMentor ? session.mentore : session.mentor;

  useEffect(() => {
    if (session.statut === 'terminee') {
      supabase.from('evaluations').select('*').eq('session_id', session.id).eq('evaluateur_id', currentUserId).maybeSingle().then(({ data }) => setExistingEval(data as Evaluation | null));
    }
  }, [session.id, session.statut, currentUserId]);

  const updateStatus = async (statut: string) => { await supabase.from('sessions').update({ statut }).eq('id', session.id); onRefresh(); };

  const submitEval = async () => {
    if (!other) return;
    setSubmitting(true);
    await supabase.from('evaluations').insert({ session_id: session.id, evaluateur_id: currentUserId, evalue_id: other.id, note: evalNote, commentaire: evalComment || null });
    setSubmitting(false);
    setShowEval(false);
    setExistingEval({ id: '', session_id: session.id, evaluateur_id: currentUserId, evalue_id: other.id, note: evalNote, commentaire: evalComment || null, created_at: new Date().toISOString() });
    onRefresh();
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        {other && <Avatar nom={other.nom} prenom={other.prenom} photoUrl={other.photo_url} size="md" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{session.matiere?.nom}</h3>
              <p className="text-sm text-slate-500">{isMentor ? 'Avec ' : 'Mentor : '}{other ? fullName(other) : ''}</p>
            </div>
            <SessionStatusBadge statut={session.statut} />
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(session.date_session)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />{formatTime(session.heure_debut)} - {formatTime(session.heure_fin)}</span>
            <span className="flex items-center gap-1.5">{session.mode === 'en_ligne' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}{session.mode === 'en_ligne' ? 'En ligne' : 'Présentiel'}</span>
          </div>
          {session.sujet && <p className="text-sm text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-1.5">{session.sujet}</p>}
          {session.lieu_ou_lien && session.statut === 'acceptee' && (
            <a href={session.mode === 'en_ligne' && session.lieu_ou_lien.startsWith('http') ? session.lieu_ou_lien : undefined} target={session.mode === 'en_ligne' ? '_blank' : undefined} rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium mt-2 hover:text-primary-700">
              {session.mode === 'en_ligne' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}{session.lieu_ou_lien}
            </a>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {isMentor && session.statut === 'demandee' && (<><Button size="sm" variant="secondary" onClick={() => updateStatus('acceptee')}><CheckCircle2 className="w-4 h-4" /> Accepter</Button><Button size="sm" variant="outline" onClick={() => updateStatus('refusee')}><XCircle className="w-4 h-4" /> Refuser</Button></>)}
            {session.statut === 'acceptee' && <Button size="sm" onClick={() => updateStatus('terminee')}><CheckCircle2 className="w-4 h-4" /> Marquer terminée</Button>}
            {['demandee', 'acceptee'].includes(session.statut) && <Button size="sm" variant="ghost" onClick={() => updateStatus('annulee')}>Annuler</Button>}
            {session.statut === 'terminee' && !existingEval && !showEval && <Button size="sm" variant="outline" onClick={() => setShowEval(true)}><Star className="w-4 h-4" /> Évaluer</Button>}
            {existingEval && <Badge color="amber"><Star className="w-3 h-3" /> Évalué : {existingEval.note}/5</Badge>}
            {other && <Link to="/app/messages" state={{ userId: other.id }} className="ml-auto"><Button size="sm" variant="ghost"><MessageSquare className="w-4 h-4" /> Message</Button></Link>}
          </div>
          {showEval && (
            <div className="mt-4 border-t border-slate-200 pt-4 space-y-3 animate-fade-in">
              <h4 className="text-sm font-medium text-slate-700">Évaluer cette session</h4>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => <button key={n} onClick={() => setEvalNote(n)} className={`p-1.5 rounded-lg transition-colors ${n <= evalNote ? 'text-accent-500' : 'text-slate-300 hover:text-slate-400'}`}><Star className="w-6 h-6" fill={n <= evalNote ? 'currentColor' : 'none'} /></button>)}
              </div>
              <Textarea value={evalComment} onChange={(e) => setEvalComment(e.target.value)} placeholder="Commentaire (optionnel)..." rows={2} />
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setShowEval(false)}>Annuler</Button><Button size="sm" onClick={submitEval} loading={submitting}>Soumettre</Button></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function SessionStatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; color: string }> = { demandee: { label: 'Demandée', color: 'amber' }, acceptee: { label: 'Acceptée', color: 'blue' }, refusee: { label: 'Refusée', color: 'red' }, terminee: { label: 'Terminée', color: 'green' }, annulee: { label: 'Annulée', color: 'slate' } };
  const cfg = map[statut] ?? map.demandee;
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}
