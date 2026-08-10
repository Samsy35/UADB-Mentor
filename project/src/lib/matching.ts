import type { Disponibilite, Matiere, ModePreference, Profile } from '@/lib/supabase';

/**
 * Pondérations du score de compatibilité (cahier des charges §12).
 */
export const POIDS = {
  matiere: 35,
  niveau: 20,
  disponibilite: 20,
  experience: 15,
  evaluation: 10,
} as const;

const EXPERTISE_SCORE: Record<string, number> = {
  expert: 1,
  avance: 0.8,
  intermediaire: 0.6,
  debutant: 0.35,
};

export type MentorCandidate = Profile & {
  mentor_matieres: { matiere: Matiere | null; niveau_expertise: string }[];
  disponibilites: Pick<Disponibilite, 'jour_semaine' | 'heure_debut' | 'heure_fin' | 'mode'>[];
};

export type MatchCriteria = {
  matiereId: string;
  niveauId: string;
  jour: number | null;
  mode: ModePreference | '';
};

export type MatchDetail = {
  matiere: number;
  niveau: number;
  disponibilite: number;
  experience: number;
  evaluation: number;
  total: number;
};

export type Rating = { moyenne: number; nombre: number };

function modeCompatible(dispoMode: ModePreference, wanted: ModePreference | ''): boolean {
  if (!wanted || wanted === 'les_deux' || dispoMode === 'les_deux') return true;
  return dispoMode === wanted;
}

/**
 * Score de compatibilité 0–100 entre un mentor et les critères de recherche.
 * Chaque critère non renseigné est neutre : il rapporte sa pondération complète
 * si le mentor satisfait la condition de base (matière déclarée, créneau existant…).
 */
export function scoreMentor(mentor: MentorCandidate, criteria: MatchCriteria, rating: Rating): MatchDetail {
  const matieres = mentor.mentor_matieres ?? [];
  const dispos = mentor.disponibilites ?? [];

  const matiereMatch = criteria.matiereId
    ? matieres.find((mm) => mm.matiere?.id === criteria.matiereId)
    : undefined;
  const matiere = criteria.matiereId
    ? matiereMatch ? POIDS.matiere : 0
    : matieres.length > 0 ? POIDS.matiere : POIDS.matiere * 0.5;

  const niveau = criteria.niveauId
    ? mentor.niveau_id === criteria.niveauId ? POIDS.niveau : POIDS.niveau * 0.5
    : POIDS.niveau;

  const creneaux = dispos.filter(
    (d) => (criteria.jour === null || d.jour_semaine === criteria.jour) && modeCompatible(d.mode, criteria.mode),
  );
  const disponibilite = dispos.length === 0
    ? 0
    : creneaux.length > 0
      ? POIDS.disponibilite * Math.min(1, 0.7 + creneaux.length * 0.15)
      : POIDS.disponibilite * 0.2;

  const expertise = matiereMatch?.niveau_expertise ?? matieres[0]?.niveau_expertise ?? 'intermediaire';
  const experienceBonus = mentor.experience ? 0.15 : 0;
  const experience = POIDS.experience * Math.min(1, (EXPERTISE_SCORE[expertise] ?? 0.6) + experienceBonus);

  const evaluation = rating.nombre > 0 ? POIDS.evaluation * (rating.moyenne / 5) : POIDS.evaluation * 0.5;

  const total = matiere + niveau + disponibilite + experience + evaluation;
  return {
    matiere: Math.round(matiere),
    niveau: Math.round(niveau),
    disponibilite: Math.round(disponibilite),
    experience: Math.round(experience),
    evaluation: Math.round(evaluation),
    total: Math.round(total),
  };
}

export function ratingsFromEvaluations(evaluations: { evalue_id: string; note: number }[]): Map<string, Rating> {
  const acc = new Map<string, { somme: number; nombre: number }>();
  for (const e of evaluations) {
    const current = acc.get(e.evalue_id) ?? { somme: 0, nombre: 0 };
    current.somme += e.note;
    current.nombre += 1;
    acc.set(e.evalue_id, current);
  }
  const result = new Map<string, Rating>();
  acc.forEach((v, k) => result.set(k, { moyenne: v.somme / v.nombre, nombre: v.nombre }));
  return result;
}

/** RG04 : une séance ne peut être programmée que sur un créneau disponible du mentor. */
export function creneauDisponible(
  dispos: Pick<Disponibilite, 'jour_semaine' | 'heure_debut' | 'heure_fin' | 'mode'>[],
  date: string,
  heureDebut: string,
  heureFin: string,
  mode: ModePreference,
): boolean {
  if (dispos.length === 0) return true;
  const jour = new Date(`${date}T00:00:00`).getDay();
  return dispos.some(
    (d) =>
      d.jour_semaine === jour &&
      modeCompatible(d.mode, mode) &&
      d.heure_debut.slice(0, 5) <= heureDebut &&
      d.heure_fin.slice(0, 5) >= heureFin,
  );
}
