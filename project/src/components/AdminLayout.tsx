import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Users, GraduationCap, BookOpen, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { UADBLogo } from '@/components/UADBLogo';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = [
    { to: '/app/admin', label: 'Vue générale', icon: LayoutDashboard, end: true },
    { to: '/app/admin/users', label: 'Utilisateurs', icon: Users, end: false },
    { to: '/app/admin/catalogue', label: 'Catalogue UADB', icon: GraduationCap, end: false },
    { to: '/app/admin/moderation', label: 'Mentorat & modération', icon: BookOpen, end: false },
  ];
  const logout = async () => { await signOut(); navigate('/login'); };
  if (!profile?.is_admin) return null;
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="hidden lg:flex w-72 fixed inset-y-0 left-0 z-30 flex-col bg-slate-950 text-white border-r border-white/10">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-white/10">
          <UADBLogo size={40} />
          <div><p className="font-bold">MentorUADB</p><p className="text-xs text-slate-400">Console administrateur</p></div>
        </div>
        <div className="px-4 py-5"><div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div><div><p className="font-semibold text-sm">Administration UADB</p><p className="text-xs text-slate-400">Accès sécurisé</p></div></div></div></div>
        <nav className="flex-1 px-4 space-y-1">{items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive?'bg-primary-600 text-white shadow-lg shadow-primary-600/20':'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon className="w-5 h-5" />{label}</NavLink>)}</nav>
        <div className="p-4 border-t border-white/10"><button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left"><Avatar nom={profile.nom} prenom={profile.prenom} photoUrl={profile.photo_url} size="sm" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{profile.prenom || 'Administrateur'} {profile.nom}</p><p className="text-xs text-slate-400">Administrateur</p></div><LogOut className="w-4 h-4 text-slate-400" /></button></div>
      </aside>
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 z-40 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 text-white"><div className="flex items-center gap-2"><UADBLogo size={32}/><span className="font-bold">Console Admin</span></div><button onClick={()=>setOpen(true)} className="p-2"><Menu/></button></div>
      {open && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/60" onClick={()=>setOpen(false)}/><div className="relative w-80 max-w-[85vw] h-full bg-slate-950 text-white p-4"><div className="flex justify-between items-center mb-6"><span className="font-bold">Administration</span><button onClick={()=>setOpen(false)}><X/></button></div>{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 ${isActive?'bg-primary-600':'hover:bg-white/5 text-slate-300'}`}><Icon className="w-5 h-5"/>{label}</NavLink>)}<button onClick={logout} className="mt-6 flex items-center gap-3 px-4 py-3 text-slate-300"><LogOut className="w-5 h-5"/>Déconnexion</button></div></div>}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 min-h-screen bg-slate-50"><div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div></main>
    </div>
  );
}
