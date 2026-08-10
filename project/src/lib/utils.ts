import { supabase } from '@/lib/supabase';
import type { Filiere, Matiere, Niveau } from '@/lib/supabase';

export async function fetchFilieres(): Promise<Filiere[]> {
  const { data, error } = await supabase.from('filieres').select('*').order('nom');
  if (error) throw error;
  return data as Filiere[];
}

export async function fetchNiveaux(): Promise<Niveau[]> {
  const { data, error } = await supabase.from('niveaux').select('*').order('ordre');
  if (error) throw error;
  return data as Niveau[];
}

export async function fetchMatieres(): Promise<Matiere[]> {
  const { data, error } = await supabase.from('matieres').select('*').order('nom');
  if (error) throw error;
  return data as Matiere[];
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
  return `${p.prenom} ${p.nom}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return formatDateTime(iso);
}
