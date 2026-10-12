import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Inbox, Clock3 } from 'lucide-react';
import { supabase, type Profile, type Matiere } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fullName } from '@/lib/utils';

type Demande = {
  id: string;
  etudiant_id: string;
  mentor_id: string;
  matiere_id: string;
  description_difficulte: string;
  objectif: string | null;
  niveau_etudiant_id: string | null;
  frequence_souhaitee: string | null;
  duree_souhaitee: string | null;
  mode_souhaite: 'en_ligne' | 'presentiel' | 'les_deux';
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'modif_demandee' | 'annulee';
  message_refus: string | null;
  created_at: string;
  etudiant?: Profile;
  mentor?: Profile;
  matiere?: Matiere;
};

export default function Requests() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'recues' | 'envoyees'>('recues');

  useEffect(() => {
    if (profile) load();
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('demandes_mentorat')
      .select(`
        *,
        etudiant:profiles!demandes_mentorat_etudiant_id_fkey(*),
        mentor:profiles!demandes_mentorat_mentor_id_fkey(*),
        matiere:matieres(*)
      `)
      .or(`etudiant_id.eq.${profile.id},mentor_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as Demande[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, statut: 'acceptee' | 'refusee' | 'annulee') => {
    setActionId(id);
    const { error } = await supabase.from('demandes_mentorat').update({ statut }).eq('id', id);
    setActionId(null);
    if (!error) load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  const visible = items.filter((d) => tab === 'recues' ? d.mentor_id === profile?.id : d.etudiant_id === profile?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Demandes de mentorat</h1>
        <p className="text-slate-500 mt-1">Suivez vos demandes et les accompagnements à venir.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('recues')} className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === 'recues' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}>Demandes reçues</button>
        <button onClick={() => setTab('envoyees')} className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === 'envoyees' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500'}`}>Mes demandes</button>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Inbox className="w-12 h-12" />} title="Aucune demande" description={tab === 'recues' ? "Vous n'avez pas encore reçu de demande." : "Vous n'avez pas encore envoyé de demande."} />
      ) : (
        <div className="space-y-4">
          {visible.map((d) => {
            const other = tab === 'recues' ? d.etudiant : d.mentor;
            const canAct = tab === 'recues' && d.statut === 'en_attente';
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-start gap-4">
                  {other && <Avatar nom={other.nom} prenom={other.prenom} photoUrl={other.photo_url} size="md" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{d.matiere?.nom ?? 'Matière'}</h3>
                        <p className="text-sm text-slate-500">{tab === 'recues' ? 'Demande de ' : 'Mentor : '}{other ? fullName(other) : ''}</p>
                      </div>
                      <StatusBadge status={d.statut} />
                    </div>
                    <p className="text-sm text-slate-700 mt-3">{d.description_difficulte}</p>
                    {d.objectif && <p className="text-sm text-slate-500 mt-2"><strong>Objectif :</strong> {d.objectif}</p>}
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                      {d.frequence_souhaitee && <Badge><Clock3 className="w-3 h-3" />{d.frequence_souhaitee}</Badge>}
                      {d.duree_souhaitee && <Badge>{d.duree_souhaitee}</Badge>}
                      <Badge>{d.mode_souhaite === 'les_deux' ? 'En ligne ou présentiel' : d.mode_souhaite === 'en_ligne' ? 'En ligne' : 'Présentiel'}</Badge>
                    </div>
                    {d.message_refus && <p className="text-sm text-error-600 mt-3">{d.message_refus}</p>}
                    {canAct && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button size="sm" onClick={() => updateStatus(d.id, 'acceptee')} loading={actionId === d.id}><CheckCircle2 className="w-4 h-4" /> Accepter</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(d.id, 'refusee')} disabled={actionId === d.id}><XCircle className="w-4 h-4" /> Refuser</Button>
                      </div>
                    )}
                    {tab === 'envoyees' && ['en_attente', 'acceptee'].includes(d.statut) && (
                      <Button size="sm" variant="ghost" className="mt-3" onClick={() => updateStatus(d.id, 'annulee')} loading={actionId === d.id}>Annuler la demande</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: 'amber' },
    acceptee: { label: 'Acceptée', color: 'green' },
    refusee: { label: 'Refusée', color: 'red' },
    modif_demandee: { label: 'Modification demandée', color: 'blue' },
    annulee: { label: 'Annulée', color: 'slate' },
  };
  const value = map[status] ?? map.en_attente;
  return <Badge color={value.color}>{value.label}</Badge>;
}
