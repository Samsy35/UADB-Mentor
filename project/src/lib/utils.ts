import { supabase } from '@/lib/supabase';
import type { Filiere, Matiere, Niveau, UFR } from '@/lib/supabase';

export async function fetchUFRs(): Promise<UFR[]> {
  const { data, error } = await supabase.from('ufrs').select('*').order('nom');
  if (error) throw error;
  return (data ?? []) as UFR[];
}

export async function fetchFilieres(ufrId?: string): Promise<Filiere[]> {
  let query = supabase.from('filieres').select('*').order('nom');
  if (ufrId) query = query.eq('ufr_id', ufrId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Filiere[];
}

export async function fetchNiveaux(): Promise<Niveau[]> {
  const { data, error } = await supabase.from('niveaux').select('*').order('ordre');
  if (error) throw error;
  return (data ?? []) as Niveau[];
}

export async function fetchMatieres(filiereId?: string, niveauId?: string): Promise<Matiere[]> {
  let query = supabase.from('matieres').select('*').eq('actif', true).order('nom');
  if (filiereId) query = query.eq('filiere_id', filiereId);
  if (niveauId) query = query.or(`niveau_id.eq.${niveauId},niveau_id.is.null`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Matiere[];
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(nom: string, prenom: string): string {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
}

export function fullName(p: { nom: string; prenom: string }): string {
  return `${p.prenom} ${p.nom}`.trim();
}
