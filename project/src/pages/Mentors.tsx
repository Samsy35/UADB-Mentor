import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Filter, MapPin, Search, Sparkles, Star, Video, X,
} from 'lucide-react';
import {
  supabase, type Filiere, type Matiere, type Mode, type ModePreference, type Niveau, JOURS,
} from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge, Button, Card, CardSkeleton, EmptyState, Modal, ProgressBar, Select, StarRating,
} from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fetchFilieres, fetchMatieres, fetchNiveaux, fullName } from '@/lib/utils';
import {
  creneauDisponible, POIDS, ratingsFromEvaluations, scoreMentor,
  type MatchCriteria, type MatchDetail, type MentorCandidate, type Rating,
} from '@/lib/matching';

type ScoredMentor = { mentor: MentorCandidate; score: MatchDetail; rating: Rating };

const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function Mentors() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<MentorCandidate[]>([]);
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [jourFilter, setJourFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<ModePreference | ''>('');
  const [noteMin, setNoteMin] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<ScoredMentor | null>(null);

  useEffect(() => {
    Promise.all([fetchMatieres(), fetchFilieres(), fetchNiveaux()]).then(([m, f, n]) => {
      setMatieres(m); setFilieres(f); setNiveaux(n);
    });
  }, []);

  useEffect(() => { if (profile) loadMentors(); }, [profile]);

  const loadMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, mentor_matieres ( niveau_expertise, matiere:matieres(*) ), disponibilites ( jour_semaine, heure_debut, heure_fin, mode )')
      .eq('is_mentor', true)
      .neq('statut_validation', 'suspendu')
      .neq('id', profile?.id ?? '');
    const list = (data ?? []) as MentorCandidate[];
    setMentors(list);

    const { data: evals } = await supabase.from('evaluations').select('evalue_id, note').eq('masquee', false);
    setRatings(ratingsFromEvaluations((evals ?? []) as { evalue_id: string; note: number }[]));
    setLoading(false);
  };

  const criteria: MatchCriteria = useMemo(() => ({
    matiereId: matiereFilter,
    niveauId: niveauFilter,
    jour: jourFilter === '' ? null : Number(jourFilter),
    mode: modeFilter,
  }), [matiereFilter, niveauFilter, jourFilter, modeFilter]);

  const results = useMemo<ScoredMentor[]>(() => {
    const min = noteMin ? Number(noteMin) : 0;
    return mentors
      .filter((m) => {
        if (matiereFilter && !m.mentor_matieres?.some((mm) => mm.matiere?.id === matiereFilter)) return false;
        if (filiereFilter && m.filiere_id !== filiereFilter) return false;
        if (jourFilter !== '' && !m.disponibilites?.some((d) => d.jour_semaine === Number(jourFilter))) return false;
        if (modeFilter && !m.disponibilites?.some((d) => d.mode === modeFilter || d.mode === 'les_deux')) return false;
        if (min > 0) {
          const r = ratings.get(m.id);
          if (!r || r.moyenne < min) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const matchesName = `${m.prenom} ${m.nom}`.toLowerCase().includes(q);
          const matchesMatiere = m.mentor_matieres?.some((mm) => mm.matiere?.nom.toLowerCase().includes(q));
          if (!matchesName && !matchesMatiere) return false;
        }
        return true;
      })
      .map((mentor) => {
        const rating = ratings.get(mentor.id) ?? { moyenne: 0, nombre: 0 };
        return { mentor, rating, score: scoreMentor(mentor, criteria, rating) };
      })
      .sort((a, b) => b.score.total - a.score.total);
  }, [mentors, ratings, criteria, search, matiereFilter, filiereFilter, jourFilter, modeFilter, noteMin]);

  const hasFilters = Boolean(search || matiereFilter || filiereFilter || niveauFilter || jourFilter || modeFilter || noteMin);

  const resetFilters = () => {
    setSearch(''); setMatiereFilter(''); setFiliereFilter(''); setNiveauFilter('');
    setJourFilter(''); setModeFilter(''); setNoteMin('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trouver un mentor</h1>
        <p className="text-slate-500 mt-1">Les mentors sont classés par score de compatibilité avec vos critères</p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou matière..."
            aria-label="Rechercher un mentor"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Select value={matiereFilter} onChange={(e) => setMatiereFilter(e.target.value)} aria-label="Filtrer par matière">
            <option value="">Toutes les matières</option>
            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </Select>
          <Select value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value)} aria-label="Mon niveau">
            <option value="">Mon niveau (indifférent)</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </Select>
          <Select value={jourFilter} onChange={(e) => setJourFilter(e.target.value)} aria-label="Filtrer par jour de disponibilité">
            <option value="">Tous les jours</option>
            {JOURS.map((j, i) => <option key={j} value={i}>{j}</option>)}
          </Select>
        </div>
        {showAdvanced && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Select value={filiereFilter} onChange={(e) => setFiliereFilter(e.target.value)} aria-label="Filtrer par filière">
              <option value="">Toutes les filières</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
            <Select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as ModePreference | '')} aria-label="Filtrer par mode">
              <option value="">Tous les modes</option>
              <option value="en_ligne">En ligne</option>
              <option value="presentiel">Présentiel</option>
            </Select>
            <Select value={noteMin} onChange={(e) => setNoteMin(e.target.value)} aria-label="Note minimale">
              <option value="">Toutes les notes</option>
              <option value="3">3 étoiles et plus</option>
              <option value="4">4 étoiles et plus</option>
              <option value="4.5">4,5 étoiles et plus</option>
            </Select>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced((v) => !v)}>
            <Filter className="w-4 h-4" /> {showAdvanced ? 'Masquer' : 'Plus de critères'}
          </Button>
          {hasFilters && <Button variant="outline" size="sm" onClick={resetFilters}><X className="w-4 h-4" /> Effacer</Button>}
        </div>
      </Card>

      {loading ? (
        <CardSkeleton count={4} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-12 h-12" />}
          title="Aucun mentor trouvé"
          description={hasFilters ? 'Essayez d’élargir vos critères de recherche.' : 'Aucun mentor n’est inscrit pour le moment.'}
          action={hasFilters ? <Button variant="outline" onClick={resetFilters}>Effacer les filtres</Button> : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {results.length} mentor{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            {matiereFilter && ' · classés par compatibilité'}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {results.map((r) => <MentorCard key={r.mentor.id} result={r} onClick={() => setSelectedMentor(r)} />)}
          </div>
        </>
      )}

      {selectedMentor && (
        <MentorDetailModal
          result={selectedMentor}
          matiereFilter={matiereFilter}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-secondary-600 bg-secondary-50' : score >= 60 ? 'text-primary-600 bg-primary-50' : 'text-slate-500 bg-slate-100';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`} title="Score de compatibilité">
      <Sparkles className="w-3.5 h-3.5" /> {score}%
    </span>
  );
}

function MentorCard({ result, onClick }: { result: ScoredMentor; onClick: () => void }) {
  const { mentor, score, rating } = result;
  const matieres = mentor.mentor_matieres?.map((mm) => mm.matiere?.nom).filter(Boolean) as string[];
  const dispos = mentor.disponibilites ?? [];
  const jours = Array.from(new Set(dispos.map((d) => d.jour_semaine))).sort();

  return (
    <Card className="p-5 hover:border-primary-300 hover:shadow-md transition-all">
      <button onClick={onClick} className="w-full text-left" aria-label={`Voir le profil de ${fullName(mentor)}`}>
        <div className="flex items-start gap-4">
          <Avatar nom={mentor.nom} prenom={mentor.prenom} photoUrl={mentor.photo_url} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{fullName(mentor)}</h3>
              <ScoreRing score={score.total} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={rating.moyenne} size="sm" />
              <span className="text-xs text-slate-400">
                {rating.nombre > 0 ? `${rating.moyenne.toFixed(1)}/5 · ${rating.nombre} avis` : 'Pas encore d’avis'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mentor.bio || 'Mentor disponible'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matieres.slice(0, 3).map((m) => <Badge key={m} color="blue">{m}</Badge>)}
              {matieres.length > 3 && <Badge>+{matieres.length - 3}</Badge>}
            </div>
          </div>
        </div>
        {jours.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="flex gap-1">
              {jours.slice(0, 5).map((j) => (
                <span key={j} className="w-8 h-7 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-medium flex items-center justify-center">{JOURS_COURTS[j]}</span>
              ))}
            </div>
            <span className="text-xs text-slate-400">disponible</span>
          </div>
        )}
      </button>
    </Card>
  );
}

function MentorDetailModal({ result, matiereFilter, onClose }: { result: ScoredMentor; matiereFilter: string; onClose: () => void }) {
  const { mentor, score, rating } = result;
  const { profile } = useAuth();
  const { notify } = useToast();
  const [showRequest, setShowRequest] = useState(false);
  const [matiereId, setMatiereId] = useState(matiereFilter);
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [mode, setMode] = useState<Mode>('en_ligne');
  const [lieu, setLieu] = useState('');
  const [sujet, setSujet] = useState('');
  const [objectif, setObjectif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mentorMatieres = (mentor.mentor_matieres ?? []).map((mm) => mm.matiere).filter(Boolean) as Matiere[];
  const dispos = mentor.disponibilites ?? [];
  const horsCreneau = date && heureDebut && heureFin && !creneauDisponible(dispos, date, heureDebut, heureFin, mode);

  const sendRequest = async () => {
    if (!profile) return;
    if (!matiereId || !date || !heureDebut || !heureFin) { setError('Veuillez remplir tous les champs obligatoires.'); return; }
    if (heureFin <= heureDebut) { setError("L'heure de fin doit être après l'heure de début."); return; }
    if (date < new Date().toISOString().slice(0, 10)) { setError('La date doit être dans le futur.'); return; }
    setSubmitting(true);
    setError('');
    const description = [sujet.trim(), objectif.trim() && `Objectif : ${objectif.trim()}`].filter(Boolean).join(' — ');
    const { error: err } = await supabase.from('sessions').insert({
      mentor_id: mentor.id,
      mentore_id: profile.id,
      matiere_id: matiereId,
      date_session: date,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      mode,
      lieu_ou_lien: lieu || null,
      sujet: description || null,
      statut: 'demandee',
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    notify('Demande envoyée au mentor.', 'success');
    setSuccess(true);
  };

  return (
    <Modal title={fullName(mentor)} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <Avatar nom={mentor.nom} prenom={mentor.prenom} photoUrl={mentor.photo_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating value={rating.moyenne} size="sm" />
              <span className="text-sm text-slate-500">{rating.nombre > 0 ? `${rating.moyenne.toFixed(1)}/5 · ${rating.nombre} avis` : 'Pas encore d’avis'}</span>
              <ScoreRing score={score.total} />
            </div>
            <p className="text-sm text-slate-600 mt-2">{mentor.bio || 'Ce mentor n’a pas encore rédigé de présentation.'}</p>
            {mentor.experience && (
              <p className="text-sm text-slate-500 mt-2"><span className="font-medium text-slate-700">Expérience :</span> {mentor.experience}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {mentorMatieres.map((m) => <Badge key={m.id} color="blue">{m.nom}</Badge>)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Détail du score de compatibilité</h4>
          <div className="space-y-2">
            <ScoreLine label={`Matière (${POIDS.matiere}%)`} value={score.matiere} max={POIDS.matiere} />
            <ScoreLine label={`Niveau adapté (${POIDS.niveau}%)`} value={score.niveau} max={POIDS.niveau} />
            <ScoreLine label={`Disponibilité (${POIDS.disponibilite}%)`} value={score.disponibilite} max={POIDS.disponibilite} />
            <ScoreLine label={`Compétence / expérience (${POIDS.experience}%)`} value={score.experience} max={POIDS.experience} />
            <ScoreLine label={`Évaluation (${POIDS.evaluation}%)`} value={score.evaluation} max={POIDS.evaluation} />
          </div>
        </div>

        {dispos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Disponibilités</h4>
            <div className="space-y-1.5">
              {dispos.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-24 font-medium">{JOURS[d.jour_semaine]}</span>
                  <span>{d.heure_debut.slice(0, 5)} - {d.heure_fin.slice(0, 5)}</span>
                  <Badge color={d.mode === 'en_ligne' ? 'blue' : d.mode === 'presentiel' ? 'green' : 'slate'}>
                    {d.mode === 'en_ligne' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {d.mode === 'en_ligne' ? 'En ligne' : d.mode === 'presentiel' ? 'Présentiel' : 'Les deux'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center mx-auto mb-3"><Star className="w-7 h-7" /></div>
            <h3 className="font-semibold text-slate-900">Demande envoyée !</h3>
            <p className="text-sm text-slate-500 mt-1">Le mentor recevra une notification et pourra accepter ou refuser.</p>
            <Button onClick={onClose} className="mt-4">Fermer</Button>
          </div>
        ) : showRequest ? (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900">Demander une session</h3>
            <Select label="Matière *" value={matiereId} onChange={(e) => setMatiereId(e.target.value)}>
              <option value="">Sélectionner...</option>
              {mentorMatieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </Select>
            <div className="grid grid-cols-3 gap-3">
              <FieldTime label="Date *" type="date" value={date} onChange={setDate} min={new Date().toISOString().slice(0, 10)} />
              <FieldTime label="Début *" type="time" value={heureDebut} onChange={setHeureDebut} />
              <FieldTime label="Fin *" type="time" value={heureFin} onChange={setHeureFin} />
            </div>
            {horsCreneau && (
              <p className="text-sm text-accent-600 bg-accent-400/10 px-3 py-2 rounded-lg">
                Ce créneau ne correspond pas aux disponibilités déclarées du mentor : il pourra refuser ou proposer un autre horaire.
              </p>
            )}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">Mode *</span>
              <div className="flex gap-2">
                <ModeButton active={mode === 'en_ligne'} onClick={() => setMode('en_ligne')} icon={<Video className="w-4 h-4" />} label="En ligne" />
                <ModeButton active={mode === 'presentiel'} onClick={() => setMode('presentiel')} icon={<MapPin className="w-4 h-4" />} label="Présentiel" />
              </div>
            </div>
            <FieldText label={mode === 'en_ligne' ? 'Lien visio' : 'Lieu'} value={lieu} onChange={setLieu} placeholder={mode === 'en_ligne' ? 'https://meet.jit.si/...' : 'Salle, bâtiment...'} />
            <FieldText label="Difficulté rencontrée" value={sujet} onChange={setSujet} placeholder="Ex : récursivité et complexité algorithmique" />
            <FieldText label="Objectif de la séance" value={objectif} onChange={setObjectif} placeholder="Ex : savoir écrire une fonction récursive" />
            {error && <p className="text-sm text-error-600 bg-error-500/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRequest(false)} className="flex-1">Retour</Button>
              <Button onClick={sendRequest} loading={submitting} className="flex-1">Envoyer la demande</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowRequest(true)} className="w-full" size="lg"><BookOpen className="w-5 h-5" /> Demander une session</Button>
        )}
      </div>
    </Modal>
  );
}

function ScoreLine({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-56 shrink-0">{label}</span>
      <ProgressBar value={value} max={max} className="flex-1" />
      <span className="text-xs font-medium text-slate-600 w-12 text-right">{value}/{max}</span>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
    >
      {icon} {label}
    </button>
  );
}

function FieldTime({ label, type, value, onChange, min }: { label: string; type: 'date' | 'time'; value: string; onChange: (v: string) => void; min?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
      />
    </div>
  );
}

function FieldText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
      />
    </div>
  );
}
