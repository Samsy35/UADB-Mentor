import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Search } from 'lucide-react';
import { supabase, type Message, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, EmptyState, Spinner } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fullName, formatDateTime } from '@/lib/utils';

type Conversation = { other: Profile; lastMessage: Message; unread: number };

export default function Messages() {
  const { profile } = useAuth();
  const location = useLocation();
  const preselectUserId = (location.state as { userId?: string } | null)?.userId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectUserId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (preselectUserId) setSelectedUserId(preselectUserId); }, [preselectUserId]);
  useEffect(() => { if (profile) loadConversations(); }, [profile]);
  useEffect(() => { if (selectedUserId) loadMessages(selectedUserId); }, [selectedUserId]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const loadConversations = async () => {
    if (!profile) return;
    const { data: msgs } = await supabase.from('messages').select('*').or(`expediteur_id.eq.${profile.id},destinataire_id.eq.${profile.id}`).order('created_at', { ascending: false });
    const msgList = (msgs ?? []) as Message[];
    const convMap = new Map<string, Conversation>();
    for (const m of msgList) {
      const otherId = m.expediteur_id === profile.id ? m.destinataire_id : m.expediteur_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { other: { id: otherId, nom: '', prenom: '' } as Profile, lastMessage: m, unread: m.destinataire_id === profile.id && !m.lu ? 1 : 0 });
      } else {
        const c = convMap.get(otherId)!;
        if (m.destinataire_id === profile.id && !m.lu) c.unread++;
      }
    }
    const otherIds = Array.from(convMap.keys());
    if (otherIds.length > 0) {
      const { data: users } = await supabase.from('profiles').select('*').in('id', otherIds);
      (users ?? []).forEach((u) => { const c = convMap.get(u.id); if (c) c.other = u as Profile; });
    }
    const { data: allU } = await supabase.from('profiles').select('*').neq('id', profile.id).order('prenom');
    setAllUsers((allU ?? []) as Profile[]);
    setConversations(Array.from(convMap.values()).sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()));
    setLoading(false);
  };

  const loadMessages = async (otherId: string) => {
    if (!profile) return;
    const { data } = await supabase.from('messages').select('*').or(`and(expediteur_id.eq.${profile.id},destinataire_id.eq.${otherId}),and(expediteur_id.eq.${otherId},destinataire_id.eq.${profile.id})`).order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
    await supabase.from('messages').update({ lu: true }).eq('expediteur_id', otherId).eq('destinataire_id', profile.id).eq('lu', false);
  };

  const send = async () => {
    if (!input.trim() || !profile || !selectedUserId) return;
    const content = input.trim();
    setInput('');
    const { data } = await supabase.from('messages').insert({ expediteur_id: profile.id, destinataire_id: selectedUserId, contenu: content }).select('*').single();
    if (data) setMessages((p) => [...p, data as Message]);
    loadConversations();
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers.filter((u) => !conversations.some((c) => c.other.id === u.id));
    const q = searchQuery.toLowerCase();
    return allUsers.filter((u) => `${u.prenom} ${u.nom}`.toLowerCase().includes(q) && !conversations.some((c) => c.other.id === u.id));
  }, [allUsers, conversations, searchQuery]);

  const selectedUser = conversations.find((c) => c.other.id === selectedUserId)?.other ?? allUsers.find((u) => u.id === selectedUserId);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8 text-primary-600" /></div>;

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>
        <p className="text-slate-500 mt-1">Échangez avec vos mentors et mentorés</p>
      </div>
      <div className="flex gap-4 h-full min-h-0">
        <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0`}>
          <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && filteredUsers.length === 0 && <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="Aucune conversation" description="Recherchez un utilisateur pour démarrer une discussion." />}
              {conversations.map((c) => (
                <button key={c.other.id} onClick={() => setSelectedUserId(c.other.id)} className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left ${selectedUserId === c.other.id ? 'bg-primary-50' : ''}`}>
                  <Avatar nom={c.other.nom} prenom={c.other.prenom} photoUrl={c.other.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.other.prenom ? fullName(c.other) : 'Chargement...'}</p>
                    <p className="text-xs text-slate-400 truncate">{c.lastMessage.contenu}</p>
                  </div>
                  {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />}
                </button>
              ))}
              {filteredUsers.length > 0 && (
                <div className="pt-2">
                  {searchQuery && <p className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Utilisateurs</p>}
                  {filteredUsers.map((u) => (
                    <button key={u.id} onClick={() => setSelectedUserId(u.id)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left">
                      <Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{fullName(u)}</p>
                        <p className="text-xs text-slate-400">{u.is_mentor ? 'Mentor' : ''} {u.is_mentore ? '· Mentoré' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
          <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {selectedUser ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                  <button onClick={() => setSelectedUserId(null)} className="md:hidden p-1 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
                  <Avatar nom={selectedUser.nom} prenom={selectedUser.prenom} photoUrl={selectedUser.photo_url} size="sm" />
                  <div><p className="font-medium text-slate-900">{fullName(selectedUser)}</p><p className="text-xs text-slate-400">{selectedUser.is_mentor ? 'Mentor' : ''} {selectedUser.is_mentore ? '· Mentoré' : ''}</p></div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {messages.length === 0 ? <div className="text-center text-sm text-slate-400 py-8">Démarrez la conversation en envoyant un message.</div> : messages.map((m) => {
                    const isMe = m.expediteur_id === profile?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                          <p>{m.contenu}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>{formatDateTime(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t border-slate-200 flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Votre message..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500" />
                  <button onClick={send} className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shrink-0"><Send className="w-4 h-4" /></button>
                </div>
              </>
            ) : (
              <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="Sélectionnez une conversation" description="Choisissez une conversation dans la liste ou recherchez un utilisateur pour démarrer une discussion." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
