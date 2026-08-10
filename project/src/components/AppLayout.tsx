import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Calendar, MessageSquare, BookMarked, Bell,
  User, LogOut, Menu, X, ShieldCheck, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { UADBLogo } from '@/components/UADBLogo';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/context/NotificationContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { unread } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems: { to: string; icon: React.ElementType; label: string; end: boolean; badge?: number }[] = [
    { to: '/app', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
    { to: '/app/mentors', icon: Search, label: 'Trouver un mentor', end: false },
    { to: '/app/sessions', icon: Calendar, label: 'Mes sessions', end: false },
    { to: '/app/ressources', icon: BookMarked, label: 'Ressources', end: false },
    { to: '/app/messages', icon: MessageSquare, label: 'Messagerie', end: false },
    { to: '/app/notifications', icon: Bell, label: 'Notifications', end: false, badge: unread },
    { to: '/app/profile', icon: User, label: 'Mon profil', end: false },
  ];

  if (profile?.is_admin) {
    navItems.push({ to: '/app/admin', icon: ShieldCheck, label: 'Administration', end: false });
  }

  const validationBadge = () => {
    if (profile?.is_admin) return null;
    if (profile?.statut_validation === 'en_attente') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent-400/10 text-accent-600 rounded-lg text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          Compte en attente de validation
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200">
          <UADBLogo size={36} />
          <span className="font-bold text-slate-900">MentorUADB</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="bg-error-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span> : null}
            </NavLink>
          ))}
          {validationBadge()}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <UserMenu profile={profile} onSignOut={handleSignOut} />
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <UADBLogo size={32} />
          <span className="font-bold text-slate-900">MentorUADB</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 inset-y-0 w-72 bg-white shadow-xl animate-slide-up flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
              <span className="font-bold text-slate-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? <span className="bg-error-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span> : null}
                </NavLink>
              ))}
              {validationBadge()}
            </nav>
            <div className="border-t border-slate-200 p-3">
              <UserMenu profile={profile} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <header className="hidden lg:flex items-center justify-end gap-2 h-16 px-8 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <NotificationBell />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({ profile, onSignOut }: { profile: ReturnType<typeof useAuth>['profile']; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <Avatar nom={profile.nom} prenom={profile.prenom} photoUrl={profile.photo_url} size="sm" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{profile.prenom} {profile.nom}</p>
          <p className="text-xs text-slate-400 truncate">
            {profile.is_admin ? 'Administrateur' : profile.is_mentor && profile.is_mentore ? 'Mentor & Mentoré' : profile.is_mentor ? 'Mentor' : 'Mentoré'}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
