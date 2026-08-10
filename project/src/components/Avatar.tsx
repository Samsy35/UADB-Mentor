import { initials } from '@/lib/utils';

export function Avatar({ nom, prenom, photoUrl, size = 'md' }: { nom: string; prenom: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes: Record<string, string> = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };
  if (photoUrl) {
    return <img src={photoUrl} alt={`${prenom} ${nom}`} className={`rounded-full object-cover ${sizes[size]}`} />;
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-semibold ${sizes[size]}`}>
      {initials(nom, prenom)}
    </div>
  );
}
