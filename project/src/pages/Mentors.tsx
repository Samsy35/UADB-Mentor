import { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Video, BookOpen, Star, Filter, X } from 'lucide-react';
import { supabase, type Profile, type Matiere, type Filiere } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, EmptyState, Spinner, Select } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fetchMatieres, fetchFilieres, fullName } from '@/lib/utils';

type MentorWithRelations = Profile & {
  mentor_matieres: { matiere: Matiere }[];
  disponibilites: { jour_semaine: number; heure_debut: string; heure_fin: string; mode: string }[];
};

export default function Mentors() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<MentorWithRelations[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<MentorWithRelations | null>(null);

  useEffect(() => {
    Promise.all([fetchMatieres(), fetchFilieres()]).then(([m, f]) => { setMatieres(m); setFilieres(f); });
    loadMentors();
  }, []);

  const loadMentors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, mentor_matieres ( matiere:matieres(*) ), disponibilites ( jour_semaine, heure_debut, heure_fin, mode )`)
      .eq('is_mentor', true)
      .neq('id', profile?.id ?? '');
    if (!error && data) setMentors(data as MentorWithRelations[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      if (matiereFilter && !m.mentor_matieres?.some((mm) => mm.matiere?.id === matiereFilter)) return false;
      if (filiereFilter && m.filiere_id !== filiereFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = `${m.prenom} ${m.nom}`.toLowerCase().includes(q);
        const matchesMatiere = m.mentor_matieres?.some((mm) => mm.matiere?.nom.toLowerCase().includes(q));
        if (!matchesName && !matchesMatiere) return false;
      }
      return true;
    });
  }, [mentors, search, matiereFilter, filiereFilter]);

  const hasFilters = search || matiereFilter || filiereFilter;

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trouver un mentor</h1>
        <p className="text-slate-500 mt-1">Recherchez un mentor par matière, filière ou nom</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou matière..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          <Select value={matiereFilter} onChange={(e) => setMatiereFilter(e.target.value)} className="flex-1 min-w-40">
            <option value="">Toutes les matières</option>
            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </Select>
          <Select value={filiereFilter} onChange={(e) => setFiliereFilter(e.target.value)} className="flex-1 min-w-40">
            <option value="">Toutes les filières</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
          {hasFilters && <Button variant="outline" onClick={() => { setSearch(''); setMatiereFilter(''); setFiliereFilter(''); }}><X className="w-4 h-4" /> Effacer</Button>}
        </div>
      </Card>

      <p className="text-sm text-slate-500">{filtered.length} mentor{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter className="w-12 h-12" />} title="Aucun mentor trouvé" description={hasFilters ? "Essayez de modifier vos critères de recherche." : "Aucun mentor n'est inscrit pour le moment."} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} onClick={() => setSelectedMentor(mentor)} />)}
        </div>
      )}

      {selectedMentor && <MentorDetailModal mentor={selectedMentor} onClose={() => setSelectedMentor(null)} />}
    </div>
  );
}

function MentorCard({ mentor, onClick }: { mentor: MentorWithRelations; onClick: () => void }) {
  const matieres = mentor.mentor_matieres?.map((mm) => mm.matiere?.nom).filter(Boolean) ?? [];
  const disponibilites = mentor.disponibilites ?? [];
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <Card className="p-5 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-4">
          <Avatar nom={mentor.nom} prenom={mentor.prenom} photoUrl={mentor.photo_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{fullName(mentor)}</h3>
            <p className="text-sm text-slate-500 truncate">{mentor.bio || 'Mentor disponible'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matieres.slice(0, 3).map((m) => <Badge key={m} color="blue">{m}</Badge>)}
              {matieres.length > 3 && <Badge>+{matieres.length - 3}</Badge>}
            </div>
          </div>
        </div>
        {disponibilites.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="flex gap-1">
              {disponibilites.slice(0, 5).map((d, i) => (
                <span key={i} className="w-7 h-7 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-medium flex items-center justify-center">{jours[d.jour_semaine]}</span>
              ))}
            </div>
            <span className="text-xs text-slate-400">disponible</span>
          </div>
        )}
      </button>
    </Card>
  );
}

function MentorDetailModal({ mentor, onClose }: { mentor: MentorWithRelations; onClose: () => void }) {
  const { profile } = useAuth();
  const [showRequest, setShowRequest] = useState(false);
  const [matiereId, setMatiereId] = useState('');
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [mode, setMode] = useState<'en_ligne' | 'presentiel'>('en_ligne');
  const [lieu, setLieu] = useState('');
  const [sujet, setSujet] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mentorMatieres = mentor.mentor_matieres?.map((mm) => mm.matiere).filter(Boolean) as Matiere[];
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const sendRequest = async () => {
    if (!profile || !matiereId || !date || !heureDebut || !heureFin) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('sessions').insert({ mentor_id: mentor.id, mentore_id: profile.id, matiere_id: matiereId, date_session: date, heure_debut: heureDebut, heure_fin: heureFin, mode, lieu_ou_lien: lieu || null, sujet: sujet || null, statut: 'demandee' });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar nom={mentor.nom} prenom={mentor.prenom} photoUrl={mentor.photo_url} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{fullName(mentor)}</h2>
              <p className="text-sm text-slate-500 mt-1">{mentor.bio || 'Mentor'}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">{mentorMatieres.map((m) => <Badge key={m.id} color="blue">{m.nom}</Badge>)}</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
          </div>

          {mentor.disponibilites && mentor.disponibilites.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Disponibilités</h3>
              <div className="space-y-1.5">
                {mentor.disponibilites.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-24 font-medium">{jours[d.jour_semaine]}</span>
                    <span>{d.heure_debut.slice(0,5)} - {d.heure_fin.slice(0,5)}</span>
                    <Badge color={d.mode === 'en_ligne' ? 'blue' : d.mode === 'presentiel' ? 'green' : 'slate'}>{d.mode === 'en_ligne' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{d.mode}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center mx-auto mb-3"><Star className="w-7 h-7" /></div>
              <h3 className="font-semibold text-slate-900">Demande envoyée !</h3>
              <p className="text-sm text-slate-500 mt-1">Le mentor recevra votre demande et pourra l'accepter ou la refuser.</p>
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
                <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Date *</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" /></div>
                <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Début *</label><input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" /></div>
                <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Fin *</label><input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Mode *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode('en_ligne')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${mode === 'en_ligne' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}><Video className="w-4 h-4" /> En ligne</button>
                  <button type="button" onClick={() => setMode('presentiel')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${mode === 'presentiel' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}><MapPin className="w-4 h-4" /> Présentiel</button>
                </div>
              </div>
              <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">{mode === 'en_ligne' ? 'Lien visio' : 'Lieu'}</label><input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder={mode === 'en_ligne' ? 'https://meet.jit.si/...' : 'Salle, bâtiment...'} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" /></div>
              <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Sujet</label><input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex: Révision intégrales..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" /></div>
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
      </div>
    </div>
  );
}
