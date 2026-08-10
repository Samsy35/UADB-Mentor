import { useEffect, useMemo, useState } from 'react';
import { BookMarked, ExternalLink, FileText, Filter, Link2, Plus, Trash2, X } from 'lucide-react';
import {
  supabase, type Matiere, type Niveau, type Ressource, type RessourceType,
} from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge, Button, Card, CardSkeleton, EmptyState, Input, Modal, Select, Textarea,
} from '@/components/ui';
import { fetchMatieres, fetchNiveaux, formatDateTime, fullName } from '@/lib/utils';

const TYPES: { value: RessourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'exercice', label: 'Exercices' },
  { value: 'fiche', label: 'Fiche de révision' },
  { value: 'cours', label: 'Support de cours' },
  { value: 'annale', label: 'Annale' },
  { value: 'correction', label: 'Correction' },
  { value: 'lien', label: 'Lien' },
];

const TYPE_COLORS: Record<RessourceType, string> = {
  pdf: 'red',
  exercice: 'blue',
  fiche: 'green',
  cours: 'purple',
  annale: 'amber',
  correction: 'slate',
  lien: 'slate',
};

export default function Ressources() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [m, n] = await Promise.all([fetchMatieres(), fetchNiveaux()]);
    setMatieres(m);
    setNiveaux(n);
    const { data } = await supabase
      .from('ressources')
      .select('*, matiere:matieres(*), niveau:niveaux(*), mentor:profiles!ressources_mentor_id_fkey(*)')
      .order('created_at', { ascending: false });
    setRessources((data ?? []) as Ressource[]);
    setLoading(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('ressources').delete().eq('id', id);
    if (error) { notify('Suppression impossible.', 'error'); return; }
    notify('Ressource supprimée.', 'success');
    load();
  };

  const filtered = useMemo(() => ressources.filter((r) => {
    if (matiereFilter && r.matiere_id !== matiereFilter) return false;
    if (niveauFilter && r.niveau_id !== niveauFilter) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.titre.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [ressources, matiereFilter, niveauFilter, typeFilter, search]);

  const hasFilters = search || matiereFilter || niveauFilter || typeFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ressources pédagogiques</h1>
          <p className="text-slate-500 mt-1">Fiches, exercices, annales et supports partagés par les mentors</p>
        </div>
        {profile?.is_mentor && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Partager une ressource</Button>}
      </div>

      <Card className="p-4 space-y-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une ressource..." aria-label="Rechercher une ressource" />
        <div className="grid sm:grid-cols-3 gap-3">
          <Select value={matiereFilter} onChange={(e) => setMatiereFilter(e.target.value)} aria-label="Filtrer par matière">
            <option value="">Toutes les matières</option>
            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </Select>
          <Select value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value)} aria-label="Filtrer par niveau">
            <option value="">Tous les niveaux</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrer par type">
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setMatiereFilter(''); setNiveauFilter(''); setTypeFilter(''); }}>
            <X className="w-4 h-4" /> Effacer les filtres
          </Button>
        )}
      </Card>

      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-12 h-12" />}
          title="Aucune ressource"
          description={hasFilters ? 'Essayez de modifier vos critères de recherche.' : 'Les mentors n’ont pas encore partagé de ressource.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  {r.type === 'lien' ? <Link2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{r.titre}</h3>
                  {r.description && <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>}
                </div>
                {r.mentor_id === profile?.id && (
                  <button onClick={() => remove(r.id)} aria-label="Supprimer la ressource" className="text-slate-400 hover:text-error-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge color={TYPE_COLORS[r.type]}>{TYPES.find((t) => t.value === r.type)?.label ?? r.type}</Badge>
                {r.matiere && <Badge color="blue">{r.matiere.nom}</Badge>}
                {r.niveau && <Badge>{r.niveau.nom}</Badge>}
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-auto">
                <p className="text-xs text-slate-400 truncate">
                  {r.mentor ? fullName(r.mentor) : 'Mentor'} · {formatDateTime(r.created_at)}
                </p>
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 shrink-0">
                  Ouvrir <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <AddRessourceModal
          matieres={matieres}
          niveaux={niveaux}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function AddRessourceModal({ matieres, niveaux, onClose, onCreated }: {
  matieres: Matiere[];
  niveaux: Niveau[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ titre: '', description: '', url: '', type: 'fiche' as RessourceType, matiere_id: '', niveau_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!profile) return;
    if (!form.titre.trim() || !form.url.trim()) { setError('Le titre et le lien sont obligatoires.'); return; }
    if (!/^https?:\/\//i.test(form.url.trim())) { setError('Le lien doit commencer par http:// ou https://'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('ressources').insert({
      mentor_id: profile.id,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      type: form.type,
      matiere_id: form.matiere_id || null,
      niveau_id: form.niveau_id || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    notify('Ressource partagée.', 'success');
    onCreated();
  };

  return (
    <Modal title="Partager une ressource" onClose={onClose}>
      <div className="space-y-4">
        <Input label="Titre *" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Fiche de révision — Récursivité" />
        <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ce que contient la ressource..." />
        <Input label="Lien *" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RessourceType })}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Matière" value={form.matiere_id} onChange={(e) => setForm({ ...form, matiere_id: e.target.value })}>
            <option value="">Aucune</option>
            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </Select>
          <Select label="Niveau" value={form.niveau_id} onChange={(e) => setForm({ ...form, niveau_id: e.target.value })}>
            <option value="">Tous</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </Select>
        </div>
        {error && <p className="text-sm text-error-600 bg-error-500/10 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={submit} loading={saving} className="flex-1"><BookMarked className="w-4 h-4" /> Partager</Button>
        </div>
      </div>
    </Modal>
  );
}
