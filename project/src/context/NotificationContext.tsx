import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, type AppNotification } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type NotificationContextType = {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as AppNotification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as AppNotification, ...prev]),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    await supabase.from('notifications').update({ lu: true }).eq('user_id', user.id).eq('lu', false);
  }, [user]);

  const value = useMemo(
    () => ({ notifications, unread: notifications.filter((n) => !n.lu).length, loading, refresh, markAsRead, markAllAsRead }),
    [notifications, loading, refresh, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
