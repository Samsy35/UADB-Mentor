import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, CheckCircle2, ClipboardList, Clock, Flag, Inbox, MapPin, MessageSquare, Star, Video, XCircle,
} from 'lucide-react';
import {
  supabase, type CompteRendu, type Evaluation, type MotifSignalement, type Session,
} from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge, Button, Card, CardSkeleton, EmptyState, Modal, ProgressBar, Select, StarRating, Tabs, Textarea,
} from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';
import { formatDate, formatTime, fullName } from '@/lib/utils';

type TabKey = 'toutes' | 'demandees' | 'avenir' | 'terminees';

export default function Sessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('toutes');

  useEffect(() => { if (profile) loadSessions(); }, [profile]);

  const loadSessions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('sessions')
      .select('*, matiere:matieres(*), mentor:profiles!sessions_mentor_id_fkey(*), mentore:profiles!sessions_mentore_id_fkey(*)')
      .or(`mentor_id.eq.${profile.id},mentore_id.eq.${profile.id}`)
      .order('date_session', { ascending: false });
    const list = (data ?? []) as Session[];
    setSessions(list);

    const ids = list.map((s) => s.id);
    if (ids.length > 0) {
      const [{ data: crs }, { data: evals }] = await Promise.all([
        supabase.from('comptes_rendus').select('*').in('session_id', ids),
        supabase.from('evaluations').select('*').in('session_id', ids),
      ]);
      setComptesRendus((crs ?? []) as CompteRendu[]);
      setEvaluations((evals ?? []) as Evaluation[]);
    } else {
      setComptesRendus([]);
      setEvaluations([]);
    }
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

  const demandesEnAttente = sessions.filter((s) => s.statut === 'demandee' && s.mentor_id === profile?.id).length;

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'demandees', label: 'Demandes', badge: demandesEnAttente },
    { key: 'avenir', label: 'À venir' },
    { key: 'terminees', label: 'Historique' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes sessions</h1>
        <p className="text-slate-500 mt-1">Gérez vos séances, leurs comptes rendus et vos évaluations</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-12 h-12" />}
          title="Aucune session"
          description="Vous n'avez pas de session dans cette catégorie."
          action={<Link to="/app/mentors"><Button>Trouver un mentor</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              currentUserId={profile?.id ?? ''}
              comptesRendus={comptesRendus.filter((cr) => cr.session_id === s.id)}
              evaluation={evaluations.find((e) => e.session_id === s.id && e.evaluateur_id === profile?.id) ?? null}
              onRefresh={loadSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, currentUserId, comptesRendus, evaluation, onRefresh }: {
  session: Session;
  currentUserId: string;
  comptesRendus: CompteRendu[];
  evaluation: Evaluation | null;
  onRefresh: () => void;
}) {
  const { notify } = useToast();
  const [showEval, setShowEval] = useState(false);
  const [showCompteRendu, setShowCompteRendu] = useState(false);
  const [showSignalement, setShowSignalement] = useState(false);

  const isMentor = session.mentor_id === currentUserId;
  const other = isMentor ? session.mentore : session.mentor;
  const monCompteRendu = comptesRendus.find((cr) => cr.auteur_id === currentUserId) ?? null;

  const updateStatus = async (statut: string, message: string) => {
    const { error } = await supabase.from('sessions').update({ statut }).eq('id', session.id);
    if (error) { notify("La mise à jour a échoué.", 'error'); return; }
    notify(message, 'success');
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
              <p className="text-sm text-slate-500">{isMentor ? 'Mentoré : ' : 'Mentor : '}{other ? fullName(other) : ''}</p>
            </div>
            <SessionStatusBadge statut={session.statut} />
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(session.date_session)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />{formatTime(session.heure_debut)} - {formatTime(session.heure_fin)}</span>
            <span className="flex items-center gap-1.5">
              {session.mode === 'en_ligne' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
              {session.mode === 'en_ligne' ? 'En ligne' : 'Présentiel'}
            </span>
          </div>

          {session.sujet && <p className="text-sm text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-1.5">{session.sujet}</p>}

          {session.lieu_ou_lien && session.statut === 'acceptee' && (
            session.mode === 'en_ligne' && session.lieu_ou_lien.startsWith('http') ? (
              <a href={session.lieu_ou_lien} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium mt-2 hover:text-primary-700">
                <Video className="w-4 h-4" />{session.lieu_ou_lien}
              </a>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-600 mt-2"><MapPin className="w-4 h-4 text-slate-400" />{session.lieu_ou_lien}</p>
            )
          )}

          {comptesRendus.length > 0 && (
            <div className="mt-3 space-y-2">
              {comptesRendus.map((cr) => <CompteRenduBlock key={cr.id} compteRendu={cr} isMine={cr.auteur_id === currentUserId} />)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {isMentor && session.statut === 'demandee' && (
              <>
                <Button size="sm" variant="secondary" onClick={() => updateStatus('acceptee', 'Demande acceptée.')}><CheckCircle2 className="w-4 h-4" /> Accepter</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus('refusee', 'Demande refusée.')}><XCircle className="w-4 h-4" /> Refuser</Button>
              </>
            )}
            {session.statut === 'acceptee' && (
              <Button size="sm" onClick={() => updateStatus('terminee', 'Session marquée comme terminée.')}><CheckCircle2 className="w-4 h-4" /> Marquer terminée</Button>
            )}
            {['demandee', 'acceptee'].includes(session.statut) && (
              <Button size="sm" variant="ghost" onClick={() => updateStatus('annulee', 'Session annulée.')}>Annuler</Button>
            )}
            {session.statut === 'terminee' && !monCompteRendu && (
              <Button size="sm" variant="outline" onClick={() => setShowCompteRendu(true)}><ClipboardList className="w-4 h-4" /> {isMentor ? 'Rédiger le compte rendu' : 'Noter ma compréhension'}</Button>
            )}
            {session.statut === 'terminee' && !evaluation && (
              <Button size="sm" variant="outline" onClick={() => setShowEval(true)}><Star className="w-4 h-4" /> Évaluer</Button>
            )}
            {evaluation && <Badge color="amber"><Star className="w-3 h-3" /> Évalué : {evaluation.note}/5</Badge>}
            {other && (
              <>
                <button onClick={() => setShowSignalement(true)} className="text-xs text-slate-400 hover:text-error-500 inline-flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" /> Signaler
                </button>
                <Link to="/app/messages" state={{ userId: other.id }} className="ml-auto">
                  <Button size="sm" variant="ghost"><MessageSquare className="w-4 h-4" /> Message</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {showCompteRendu && (
        <CompteRenduModal
          session={session}
          isMentor={isMentor}
          currentUserId={currentUserId}
          onClose={() => setShowCompteRendu(false)}
          onSaved={() => { setShowCompteRendu(false); onRefresh(); }}
        />
      )}
      {showEval && other && (
        <EvaluationModal
          sessionId={session.id}
          evalueId={other.id}
          evaluateurId={currentUserId}
          onClose={() => setShowEval(false)}
          onSaved={() => { setShowEval(false); onRefresh(); }}
        />
      )}
      {showSignalement && other && (
        <SignalementModal
          sessionId={session.id}
          signaleId={other.id}
          signaleurId={currentUserId}
          signaleNom={fullName(other)}
          onClose={() => setShowSignalement(false)}
        />
      )}
    </Card>
  );
}

function CompteRenduBlock({ compteRendu, isMine }: { compteRendu: CompteRendu; isMine: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/60">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-primary-600" /> Compte rendu {isMine ? '(le vôtre)' : ''}
        </p>
        <span className="text-xs text-slate-500">Compréhension {compteRendu.niveau_comprehension}/5</span>
      </div>
      <ProgressBar value={compteRendu.niveau_comprehension} max={5} className="mb-2" />
      <dl className="text-sm text-slate-600 space-y-1">
        <Detail label="Sujet traité" value={compteRendu.sujet_traite} />
        <Detail label="Notions abordées" value={compteRendu.notions_abordees} />
        <Detail label="Difficultés" value={compteRendu.difficultes} />
        <Detail label="Exercices" value={compteRendu.exercices} />
        <Detail label="Recommandations" value={compteRendu.recommandations} />
        <Detail label="Objectif prochaine séance" value={compteRendu.objectif_prochaine} />
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400 shrink-0">{label} :</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}

function CompteRenduModal({ session, isMentor, currentUserId, onClose, onSaved }: {
  session: Session;
  isMentor: boolean;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [form, setForm] = useState({
    sujet_traite: session.sujet ?? '',
    notions_abordees: '',
    difficultes: '',
    exercices: '',
    niveau_comprehension: 3,
    recommandations: '',
    objectif_prochaine: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.sujet_traite.trim()) { setError('Le sujet traité est obligatoire.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('comptes_rendus').insert({
      session_id: session.id,
      auteur_id: currentUserId,
      sujet_traite: form.sujet_traite.trim(),
      notions_abordees: form.notions_abordees.trim() || null,
      difficultes: form.difficultes.trim() || null,
      exercices: form.exercices.trim() || null,
      niveau_comprehension: form.niveau_comprehension,
      recommandations: form.recommandations.trim() || null,
      objectif_prochaine: form.objectif_prochaine.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    notify('Compte rendu enregistré.', 'success');
    onSaved();
  };

  return (
    <Modal title="Compte rendu de séance" onClose={onClose} size="lg">
      <div className="space-y-4">
        <Textarea label="Sujet traité *" rows={2} value={form.sujet_traite} onChange={(e) => setForm({ ...form, sujet_traite: e.target.value })} placeholder="Ex : récursivité et complexité" />
        {isMentor && (
          <>
            <Textarea label="Notions abordées" rows={2} value={form.notions_abordees} onChange={(e) => setForm({ ...form, notions_abordees: e.target.value })} />
            <Textarea label="Difficultés observées" rows={2} value={form.difficultes} onChange={(e) => setForm({ ...form, difficultes: e.target.value })} />
            <Textarea label="Exercices réalisés" rows={2} value={form.exercices} onChange={(e) => setForm({ ...form, exercices: e.target.value })} />
          </>
        )}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Niveau de compréhension</span>
          <Select value={form.niveau_comprehension} onChange={(e) => setForm({ ...form, niveau_comprehension: Number(e.target.value) })} aria-label="Niveau de compréhension">
            <option value={1}>1 — Notions non acquises</option>
            <option value={2}>2 — Fragile</option>
            <option value={3}>3 — Moyen</option>
            <option value={4}>4 — Bon</option>
            <option value={5}>5 — Maîtrisé</option>
          </Select>
        </div>
        {isMentor && (
          <>
            <Textarea label="Recommandations" rows={2} value={form.recommandations} onChange={(e) => setForm({ ...form, recommandations: e.target.value })} placeholder="Ex : revoir les exercices 3 à 6" />
            <Textarea label="Objectif de la prochaine séance" rows={2} value={form.objectif_prochaine} onChange={(e) => setForm({ ...form, objectif_prochaine: e.target.value })} />
          </>
        )}
        {error && <p className="text-sm text-error-600 bg-error-500/10 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={submit} loading={saving} className="flex-1">Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
}

function EvaluationModal({ sessionId, evalueId, evaluateurId, onClose, onSaved }: {
  sessionId: string;
  evalueId: string;
  evaluateurId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [criteres, setCriteres] = useState({ pedagogie: 5, ponctualite: 5, clarte: 5, disponibilite: 5 });
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const globale = Math.round((criteres.pedagogie + criteres.ponctualite + criteres.clarte + criteres.disponibilite) / 4);

  const submit = async () => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('evaluations').insert({
      session_id: sessionId,
      evaluateur_id: evaluateurId,
      evalue_id: evalueId,
      note: globale,
      note_pedagogie: criteres.pedagogie,
      note_ponctualite: criteres.ponctualite,
      note_clarte: criteres.clarte,
      note_disponibilite: criteres.disponibilite,
      commentaire: commentaire.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    notify('Merci pour votre évaluation.', 'success');
    onSaved();
  };

  return (
    <Modal title="Évaluer la séance" onClose={onClose}>
      <div className="space-y-4">
        <StarRating label="Qualité pédagogique" value={criteres.pedagogie} onChange={(n) => setCriteres({ ...criteres, pedagogie: n })} />
        <StarRating label="Ponctualité" value={criteres.ponctualite} onChange={(n) => setCriteres({ ...criteres, ponctualite: n })} />
        <StarRating label="Clarté des explications" value={criteres.clarte} onChange={(n) => setCriteres({ ...criteres, clarte: n })} />
        <StarRating label="Disponibilité" value={criteres.disponibilite} onChange={(n) => setCriteres({ ...criteres, disponibilite: n })} />
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">Satisfaction générale</span>
          <StarRating value={globale} size="sm" />
          <span className="text-sm text-slate-500">{globale}/5</span>
        </div>
        <Textarea label="Commentaire (optionnel)" rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        {error && <p className="text-sm text-error-600 bg-error-500/10 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={submit} loading={saving} className="flex-1">Envoyer</Button>
        </div>
      </div>
    </Modal>
  );
}

const MOTIFS: { value: MotifSignalement; label: string }[] = [
  { value: 'absence', label: 'Absence non justifiée' },
  { value: 'comportement', label: 'Comportement inapproprié' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { value: 'faux_profil', label: 'Faux profil' },
  { value: 'autre', label: 'Autre' },
];

function SignalementModal({ sessionId, signaleId, signaleurId, signaleNom, onClose }: {
  sessionId: string;
  signaleId: string;
  signaleurId: string;
  signaleNom: string;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [motif, setMotif] = useState<MotifSignalement>('comportement');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('signalements').insert({
      signaleur_id: signaleurId,
      signale_id: signaleId,
      session_id: sessionId,
      motif,
      description: description.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    notify("Signalement transmis à l'administration.", 'success');
    onClose();
  };

  return (
    <Modal title={`Signaler ${signaleNom}`} onClose={onClose}>
      <div className="space-y-4">
        <Select label="Motif" value={motif} onChange={(e) => setMotif(e.target.value as MotifSignalement)}>
          {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez la situation..." />
        {error && <p className="text-sm text-error-600 bg-error-500/10 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button variant="danger" onClick={submit} loading={saving} className="flex-1"><Flag className="w-4 h-4" /> Signaler</Button>
        </div>
      </div>
    </Modal>
  );
}
