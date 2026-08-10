import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { timeAgo } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

export default function NotificationBell() {
  const { notifications, unread, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const openNotification = async (id: string, lien: string | null) => {
    await markAsRead(id);
    setOpen(false);
    if (lien) navigate(lien);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications, ${unread} non lues` : 'Notifications'}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl z-40 overflow-hidden animate-scale-in origin-top-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState icon={<Bell className="w-10 h-10" />} title="Aucune notification" description="Vos notifications apparaîtront ici." />
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n.id, n.lien)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${n.lu ? '' : 'bg-primary-50/60'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lu && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary-600 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{n.titre}</p>
                        {n.contenu && <p className="text-xs text-slate-500 mt-0.5">{n.contenu}</p>}
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/app/notifications'); }}
              className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-slate-50"
            >
              Voir toutes les notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
}
