import { useEffect, useState } from 'react';
import { User, BookOpen, Calendar, Clock, Plus, X, Check, Phone } from 'lucide-react';
import { supabase, type Matiere, type Filiere, type Niveau, type MentorMatiere, type Disponibilite, type Session, JOURS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, Input, Select, Textarea, Spinner, EmptyState } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fetchMatieres, fetchFilieres, fetchNiveaux, formatDate, formatTime, fullName } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [myMatieres, setMyMatieres] = useState<MentorMatiere[]>([]);
  const [myDispos, setMyDispos] = useState<Disponibilite[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMatiere, setShowAddMatiere] = useState(false);
  const [showAddDispo, setShowAddDispo] = useState(false);

  const [editForm, setEditForm] = useState({ nom: '', prenom: '', telephone: '', niveau_id: '', filiere_id: '', bio: '', photo_url: '', is_mentor: false, is_mentore: true });

  useEffect(() => {
    if (profile) {
      setEditForm({ nom: profile.nom, prenom: profile.prenom, telephone: profile.telephone, niveau_id: profile.niveau_id ?? '', filiere_id: profile.filiere_id ?? '', bio: profile.bio ?? '', photo_url: profile.photo_url ?? '', is_mentor: profile.is_mentor, is_mentore: profile.is_mentore });
      loadMentorData();
    }
  }, [profile]);

  const loadMentorData = async () => {
    if (!profile) return;
    const [m, f, n] = await Promise.all([fetchMatieres(), fetchFilieres(), fetchNiveaux()]);
    setMatieres(m); setFilieres(f); setNiveaux(n);
    const { data: mm } = await supabase.from('mentor_matieres').select('*, matiere:matieres(*)').eq('mentor_id', profile.id);
    setMyMatieres((mm ?? []) as MentorMatiere[]);
    const { data: dd } = await supabase.from('disponibilites').select('*').eq('mentor_id', profile.id).order('jour_semaine');
    setMyDispos((dd ?? []) as Disponibilite[]);
    const { data: ss } = await supabase.from('sessions').select('*, matiere:matieres(*)').or(`mentor_id.eq.${profile.id},mentore_id.eq.${profile.id}`).order('date_session', { ascending: false }).limit(5);
    setMySessions((ss ?? []) as Session[]);
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ nom: editForm.nom, prenom: editForm.prenom, telephone: editForm.telephone, niveau_id: editForm.niveau_id || null, filiere_id: editForm.filiere_id || null, bio: editForm.bio || null, photo_url: editForm.photo_url || null, is_mentor: editForm.is_mentor, is_mentore: editForm.is_mentore }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  };

  const addMatiere = async (matiereId: string) => { if (!profile) return; await supabase.from('mentor_matieres').insert({ mentor_id: profile.id, matiere_id: matiereId }); setShowAddMatiere(false); loadMentorData(); };
  const removeMatiere = async (id: string) => { await supabase.from('mentor_matieres').delete().eq('id', id); loadMentorData(); };
  const addDispo = async (dispo: Omit<Disponibilite, 'id' | 'mentor_id' | 'created_at'>) => { if (!profile) return; await supabase.from('disponibilites').insert({ ...dispo, mentor_id: profile.id }); setShowAddDispo(false); loadMentorData(); };
  const removeDispo = async (id: string) => { await supabase.from('disponibilites').delete().eq('id', id); loadMentorData(); };

  if (loading || !profile) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  const filiere = filieres.find((f) => f.id === profile.filiere_id);
  const niveau = niveaux.find((n) => n.id === profile.niveau_id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        {!editing ? <Button variant="outline" onClick={() => setEditing(true)}><User className="w-4 h-4" /> Modifier</Button> : <div className="flex gap-2"><Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button><Button onClick={saveProfile} loading={saving}><Check className="w-4 h-4" /> Enregistrer</Button></div>}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar nom={profile.nom} prenom={profile.prenom} photoUrl={profile.photo_url} size="xl" />
            {editing && <Input value={editForm.photo_url} onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })} placeholder="URL photo" className="text-xs" />}
            <div className="flex gap-1.5">
              {profile.is_mentor && <Badge color="green"><BookOpen className="w-3 h-3" /> Mentor</Badge>}
              {profile.is_mentore && <Badge color="blue">Mentoré</Badge>}
              {profile.is_admin && <Badge color="amber">Admin</Badge>}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {!editing ? (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{fullName(profile)}</h2>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {profile.numero_carte}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {profile.telephone}</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {niveau && <InfoRow label="Niveau" value={niveau.nom} />}
                  {filiere && <InfoRow label="Filière" value={filiere.nom} />}
                </div>
                {profile.bio && <div className="pt-2"><p className="text-xs font-medium text-slate-400 uppercase mb-1">Présentation</p><p className="text-sm text-slate-700">{profile.bio}</p></div>}
                <Badge color={profile.statut_validation === 'valide' ? 'green' : profile.statut_validation === 'en_attente' ? 'amber' : 'red'}>{profile.statut_validation === 'valide' ? 'Compte validé' : profile.statut_validation === 'en_attente' ? 'En attente de validation' : 'Compte suspendu'}</Badge>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><Input label="Prénom" value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} /><Input label="Nom" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} /></div>
                <Input label="Téléphone" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} />
                <div className="grid grid-cols-2 gap-4"><Select label="Niveau" value={editForm.niveau_id} onChange={(e) => setEditForm({ ...editForm, niveau_id: e.target.value })}><option value="">Aucun</option>{niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}</Select><Select label="Filière" value={editForm.filiere_id} onChange={(e) => setEditForm({ ...editForm, filiere_id: e.target.value })}><option value="">Aucune</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</Select></div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={editForm.is_mentore} onChange={(e) => setEditForm({ ...editForm, is_mentore: e.target.checked })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" /> Mentoré</label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={editForm.is_mentor} onChange={(e) => setEditForm({ ...editForm, is_mentor: e.target.checked })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" /> Mentor</label>
                </div>
                <Textarea label="Présentation (mentor)" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {profile.is_mentor && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-600" /> Matières enseignées</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddMatiere(true)}><Plus className="w-4 h-4" /> Ajouter</Button>
          </div>
          {myMatieres.length === 0 ? <EmptyState icon={<BookOpen className="w-10 h-10" />} title="Aucune matière" description="Ajoutez les matières que vous pouvez enseigner pour que des mentorés vous trouvent." /> : (
            <div className="flex flex-wrap gap-2">{myMatieres.map((mm) => <div key={mm.id} className="flex items-center gap-2 bg-primary-50 text-primary-700 rounded-lg px-3 py-2 text-sm font-medium">{mm.matiere?.nom}<button onClick={() => removeMatiere(mm.id)} className="text-primary-400 hover:text-error-500"><X className="w-4 h-4" /></button></div>)}</div>
          )}
        </Card>
      )}

      {profile.is_mentor && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-5 h-5 text-primary-600" /> Disponibilités</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddDispo(true)}><Plus className="w-4 h-4" /> Ajouter</Button>
          </div>
          {myDispos.length === 0 ? <EmptyState icon={<Clock className="w-10 h-10" />} title="Aucune disponibilité" description="Définissez vos créneaux pour que les mentorés savent quand vous êtes disponible." /> : (
            <div className="space-y-2">{myDispos.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <span className="w-24 font-medium text-slate-700 text-sm">{JOURS[d.jour_semaine]}</span>
                <span className="text-sm text-slate-600">{formatTime(d.heure_debut)} - {formatTime(d.heure_fin)}</span>
                <Badge color={d.mode === 'en_ligne' ? 'blue' : d.mode === 'presentiel' ? 'green' : 'slate'}>{d.mode}</Badge>
                <button onClick={() => removeDispo(d.id)} className="ml-auto text-slate-400 hover:text-error-500"><X className="w-4 h-4" /></button>
              </div>
            ))}</div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-primary-600" /> Sessions récentes</h2>
        {mySessions.length === 0 ? <p className="text-sm text-slate-400">Aucune session pour le moment.</p> : (
          <div className="space-y-2">{mySessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
              <div className="flex-1"><p className="text-sm font-medium text-slate-800">{s.matiere?.nom}</p><p className="text-xs text-slate-500">{formatDate(s.date_session)} · {formatTime(s.heure_debut)}</p></div>
              <Badge color={s.statut === 'terminee' ? 'green' : s.statut === 'acceptee' ? 'blue' : s.statut === 'demandee' ? 'amber' : 'slate'}>{s.statut}</Badge>
            </div>
          ))}</div>
        )}
      </Card>

      {showAddMatiere && <AddMatiereModal matieres={matieres} existingIds={myMatieres.map((mm) => mm.matiere?.id).filter(Boolean) as string[]} onAdd={addMatiere} onClose={() => setShowAddMatiere(false)} />}
      {showAddDispo && <AddDispoModal onAdd={addDispo} onClose={() => setShowAddDispo(false)} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-slate-400 uppercase">{label}</p><p className="text-slate-800">{value}</p></div>;
}

function AddMatiereModal({ matieres, existingIds, onAdd, onClose }: { matieres: Matiere[]; existingIds: string[]; onAdd: (id: string) => void; onClose: () => void }) {
  const available = matieres.filter((m) => !existingIds.includes(m.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-900">Ajouter une matière</h3><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div>
        {available.length === 0 ? <p className="text-sm text-slate-500 py-4">Toutes les matières sont déjà ajoutées.</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto">{available.map((m) => (
            <button key={m.id} onClick={() => onAdd(m.id)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
              <div><p className="font-medium text-sm text-slate-800">{m.nom}</p>{m.description && <p className="text-xs text-slate-400">{m.description}</p>}</div>
              <Plus className="w-4 h-4 text-primary-600" />
            </button>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function AddDispoModal({ onAdd, onClose }: { onAdd: (d: Omit<Disponibilite, 'id' | 'mentor_id' | 'created_at'>) => void; onClose: () => void }) {
  const [jour, setJour] = useState(1);
  const [heureDebut, setHeureDebut] = useState('09:00');
  const [heureFin, setHeureFin] = useState('11:00');
  const [mode, setMode] = useState<'en_ligne' | 'presentiel' | 'les_deux'>('en_ligne');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-900">Ajouter une disponibilité</h3><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div>
        <div className="space-y-4">
          <Select label="Jour" value={jour} onChange={(e) => setJour(Number(e.target.value))}>{JOURS.map((j, i) => <option key={i} value={i}>{j}</option>)}</Select>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Début</label><input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" /></div>
            <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Fin</label><input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" /></div>
          </div>
          <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="en_ligne">En ligne</option><option value="presentiel">Présentiel</option><option value="les_deux">Les deux</option></Select>
          <Button onClick={() => onAdd({ jour_semaine: jour, heure_debut: heureDebut, heure_fin: heureFin, mode })} className="w-full">Ajouter</Button>
        </div>
      </div>
    </div>
  );
}
