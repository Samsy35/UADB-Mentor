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
  filiere_id: string | null;
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
  mode: 'en_ligne' | 'presentiel' | 'les_deux';
};

export type Session = {
  id: string;
  mentor_id: string;
  mentore_id: string;
  matiere_id: string;
  date_session: string;
  heure_debut: string;
  heure_fin: string;
  mode: 'en_ligne' | 'presentiel';
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
  commentaire: string | null;
  created_at: string;
};
