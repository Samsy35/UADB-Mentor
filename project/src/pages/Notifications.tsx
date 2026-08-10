import { Link } from 'react-router-dom';
import {
  Bell, CheckCheck, CalendarCheck, CalendarX, MessageSquare, Star, ShieldCheck, Inbox, BookMarked,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Card, Button, EmptyState, CardSkeleton } from '@/components/ui';
import { timeAgo } from '@/lib/utils';
import type { NotificationType } from '@/lib/supabase';

const ICONS: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  demande_recue: { icon: Inbox, color: 'bg-primary-50 text-primary-600' },
  demande_acceptee: { icon: CalendarCheck, color: 'bg-secondary-50 text-secondary-600' },
  demande_refusee: { icon: CalendarX, color: 'bg-error-500/10 text-error-600' },
  session_annulee: { icon: CalendarX, color: 'bg-slate-100 text-slate-500' },
  session_terminee: { icon: CalendarCheck, color: 'bg-secondary-50 text-secondary-600' },
  nouveau_message: { icon: MessageSquare, color: 'bg-primary-50 text-primary-600' },
  nouvelle_evaluation: { icon: Star, color: 'bg-accent-400/15 text-accent-600' },
  compte_valide: { icon: ShieldCheck, color: 'bg-secondary-50 text-secondary-600' },
  nouvelle_ressource: { icon: BookMarked, color: 'bg-violet-100 text-violet-700' },
};

export default function Notifications() {
  const { notifications, unread, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">{unread > 0 ? `${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}><CheckCheck className="w-4 h-4" /> Tout marquer comme lu</Button>
        )}
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-12 h-12" />} title="Aucune notification" description="Vous serez notifié des demandes, messages, séances et évaluations." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = ICONS[n.type] ?? { icon: Bell, color: 'bg-slate-100 text-slate-500' };
            const Icon = cfg.icon;
            const content = (
              <Card className={`p-4 flex items-start gap-3 transition-colors ${n.lu ? '' : 'border-primary-200 bg-primary-50/40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{n.titre}</p>
                  {n.contenu && <p className="text-sm text-slate-500 mt-0.5">{n.contenu}</p>}
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.lu && <span className="w-2 h-2 rounded-full bg-primary-600 mt-2 shrink-0" />}
              </Card>
            );
            return n.lien ? (
              <Link key={n.id} to={n.lien} onClick={() => markAsRead(n.id)} className="block">{content}</Link>
            ) : (
              <button key={n.id} onClick={() => markAsRead(n.id)} className="block w-full text-left">{content}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
