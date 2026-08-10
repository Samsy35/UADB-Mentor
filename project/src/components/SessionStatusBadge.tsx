import { Badge } from '@/components/ui';

const STATUTS: Record<string, { label: string; color: string }> = {
  demandee: { label: 'Demandée', color: 'amber' },
  acceptee: { label: 'Acceptée', color: 'blue' },
  refusee: { label: 'Refusée', color: 'red' },
  terminee: { label: 'Terminée', color: 'green' },
  annulee: { label: 'Annulée', color: 'slate' },
};

export function SessionStatusBadge({ statut }: { statut: string }) {
  const cfg = STATUTS[statut] ?? STATUTS.demandee;
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

export function statutLabel(statut: string): string {
  return STATUTS[statut]?.label ?? statut;
}
