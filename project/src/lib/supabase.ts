import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export type Mode = 'en_ligne' | 'presentiel';
export type ModePreference = Mode | 'les_deux';

export type Profile = {
  id: string;
  nom: string;
  prenom: string;
  numero_carte: string;
  niveau_id: string | null;
  filiere_id: string | null;
  telephone: string;
  photo_url: string | null;
  is_mentor: boolean;
  is_mentore: boolean;
  is_admin: boolean;
  statut_validation: 'en_attente' | 'valide' | 'suspendu';
  bio: string | null;
  experience: string | null;
  mode_preference: ModePreference;
  created_at: string;
  updated_at: string;
};

export type Filiere = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
};

export type Niveau = {
  id: string;
  code: string;
  nom: string;
  ordre: number;
};

export type Matiere = {
  id: string;
  nom: string;
  code: string | null;
  filiere_id: string | null;
  niveau_id: string | null;
  description: string | null;
};

export type MentorMatiere = {
  id: string;
  mentor_id: string;
  matiere_id: string;
  niveau_expertise: string;
  matiere?: Matiere;
};

export type Disponibilite = {
  id: string;
  mentor_id: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  mode: ModePreference;
};

export type Session = {
  id: string;
  mentor_id: string;
  mentore_id: string;
  matiere_id: string;
  date_session: string;
  heure_debut: string;
  heure_fin: string;
  mode: Mode;
  lieu_ou_lien: string | null;
  sujet: string | null;
  statut: 'demandee' | 'acceptee' | 'refusee' | 'terminee' | 'annulee';
  created_at: string;
  matiere?: Matiere;
  mentor?: Profile;
  mentore?: Profile;
};

export type Message = {
  id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
};

export type Evaluation = {
  id: string;
  session_id: string;
  evaluateur_id: string;
  evalue_id: string;
  note: number;
  note_pedagogie: number | null;
  note_ponctualite: number | null;
  note_clarte: number | null;
  note_disponibilite: number | null;
  masquee: boolean;
  commentaire: string | null;
  created_at: string;
};

export type NotificationType =
  | 'demande_recue'
  | 'demande_acceptee'
  | 'demande_refusee'
  | 'session_annulee'
  | 'session_terminee'
  | 'nouveau_message'
  | 'nouvelle_evaluation'
  | 'compte_valide'
  | 'nouvelle_ressource';

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  titre: string;
  contenu: string | null;
  lien: string | null;
  lu: boolean;
  created_at: string;
};

export type RessourceType = 'pdf' | 'exercice' | 'fiche' | 'lien' | 'cours' | 'annale' | 'correction';

export type Ressource = {
  id: string;
  mentor_id: string;
  matiere_id: string | null;
  niveau_id: string | null;
  titre: string;
  description: string | null;
  type: RessourceType;
  url: string;
  created_at: string;
  matiere?: Matiere | null;
  niveau?: Niveau | null;
  mentor?: Profile | null;
};

export type CompteRendu = {
  id: string;
  session_id: string;
  auteur_id: string;
  sujet_traite: string;
  notions_abordees: string | null;
  difficultes: string | null;
  exercices: string | null;
  niveau_comprehension: number;
  recommandations: string | null;
  objectif_prochaine: string | null;
  created_at: string;
};

export type MotifSignalement = 'absence' | 'comportement' | 'contenu_inapproprie' | 'faux_profil' | 'autre';

export type Signalement = {
  id: string;
  signaleur_id: string;
  signale_id: string;
  session_id: string | null;
  motif: MotifSignalement;
  description: string | null;
  statut: 'ouvert' | 'en_cours' | 'resolu' | 'rejete';
  created_at: string;
  signaleur?: Profile | null;
  signale?: Profile | null;
};
