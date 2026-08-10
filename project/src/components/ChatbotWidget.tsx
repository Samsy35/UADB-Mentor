import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ChatMessage = { role: 'user' | 'bot'; content: string };

const FAQ_RULES: { keywords: string[]; response: string }[] = [
  { keywords: ['comment', 'marche', 'fonctionne', 'utiliser', 'plateforme'], response: "MentorUADB permet de mettre en relation des étudiants avec des mentors. Étapes : 1) Créez un compte. 2) Allez dans « Trouver un mentor » pour rechercher par matière. 3) Envoyez une demande de session au mentor choisi. 4) Une fois acceptée, vous pouvez échanger via la messagerie et faire votre session (en ligne ou présentiel)." },
  { keywords: ['mentor', 'trouver', 'chercher', 'rechercher'], response: "Pour trouver un mentor : rendez-vous dans « Trouver un mentor », sélectionnez la matière, puis parcourez la liste des mentors disponibles. Vous pouvez voir leur profil et envoyer une demande de session directement." },
  { keywords: ['session', 'rendez', 'rdv', 'tutorat'], response: "Une session de tutorat se demande depuis le profil d'un mentor. Vous choisissez la date, l'heure, le mode (en ligne ou présentiel) et un sujet. Le mentor doit ensuite accepter votre demande." },
  { keywords: ['matiere', 'matières', 'cours'], response: "Les matières couvrent les 4 composantes de l'UADB : UFR SATIC (Maths, Physique, Chimie, TIC), UFR SDD (Santé, Environnement), UFR ECOMIJ (Économie, Finance, Management, Droit) et ISFAR (Agriculture, Élevage, Foresterie, Génie Rural)." },
  { keywords: ['inscription', 'inscrire', 'compte', 'creer', 'créer'], response: "Pour vous inscrire : cliquez sur « Créer un compte », remplissez vos informations et choisissez votre rôle (mentoré, mentor, ou les deux). Votre compte sera validé par un administrateur." },
  { keywords: ['devenir', 'mentor'], response: "Pour devenir mentor : lors de l'inscription, cochez « Mentor ». Une fois connecté, ajoutez vos matières dans votre profil et définissez vos disponibilités." },
  { keywords: ['disponibilite', 'disponibilité', 'creneau', 'créneau', 'horaire'], response: "Les mentors définissent leurs disponibilités dans leur profil (jours et créneaux horaires)." },
  { keywords: ['message', 'messagerie', 'discuter', 'contacter'], response: "La messagerie permet d'échanger avec un mentor ou mentoré. Allez dans « Messagerie », sélectionnez une conversation ou démarrez-en une nouvelle." },
  { keywords: ['evaluation', 'évaluation', 'note', 'notation'], response: "Après une session terminée, vous pouvez évaluer la séance (note sur 5 et commentaire)." },
  { keywords: ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir'], response: "Bonjour ! Je suis l'assistant MentorUADB. Je peux vous aider à comprendre la plateforme, trouver un mentor, ou organiser une session. Posez-moi votre question !" },
  { keywords: ['merci'], response: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Bonne révision !" },
  { keywords: ['integr', 'derive', 'dériv', 'limite', 'math'], response: "Pour les questions de mathématiques, je vous recommande de prendre une session avec un mentor en « Analyse Mathématique » ou « Algèbre Linéaire ». Allez dans « Trouver un mentor »." },
  { keywords: ['algorithme', 'code', 'programmation', 'bug'], response: "Pour les questions de programmation, prenez une session avec un mentor en « Algorithmique et Structures de Données ». Allez dans « Trouver un mentor »." },
  { keywords: ['validation', 'valide', 'admin'], response: "Les comptes sont validés manuellement par les administrateurs. Cette vérification assure que seuls de vrais étudiants de l'UADB utilisent la plateforme." },
  { keywords: ['uadb', 'université', 'filière', 'filiere'], response: "L'UADB compte 4 composantes : UFR SATIC (Maths, Physique, Chimie, TIC — Ngoundiane), UFR SDD (Santé, Environnement — Diourbel), UFR ECOMIJ (Économie, Management, Droit — Bambey) et ISFAR (Agriculture, Élevage, Foresterie — Bambey)." },
];

function getBotResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.response;
  }
  return "Je ne suis pas sûr de pouvoir répondre à cette question précise. Je vous recommande de consulter un mentor dans « Trouver un mentor » pour une aide personnalisée.";
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: "Bonjour ! Je suis l'assistant MentorUADB. Posez-moi une question sur la plateforme, ou demandez de l'aide pour trouver un mentor." },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !user) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((p) => [...p, { role: 'user', content: userMsg }]);
    setLoading(true);

    const history = messages.slice(-10).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    let botResponse = '';
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ message: userMsg, history }),
      });
      if (res.ok) {
        const data = await res.json();
        botResponse = data.response ?? getBotResponse(userMsg);
      } else {
        botResponse = getBotResponse(userMsg);
      }
    } catch {
      botResponse = getBotResponse(userMsg);
    }

    setMessages((p) => [...p, { role: 'bot', content: botResponse }]);
    setLoading(false);

    try {
      await supabase.from('chatbot_conversations').insert({ user_id: user.id, message_utilisateur: userMsg, reponse_ia: botResponse });
    } catch { /* ignore logging errors */ }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-600/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Assistant IA"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col animate-scale-in origin-bottom-right">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-t-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">Assistant MentorUADB</p>
              <p className="text-xs text-secondary-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> En ligne
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-60 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
              placeholder="Posez votre question..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
