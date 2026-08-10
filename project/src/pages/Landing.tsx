import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  GraduationCap, Search, Calendar, MessageSquare, Star, ArrowRight,
  BookOpen, Users, Clock, ShieldCheck, Sparkles, CheckCircle2, Menu, X,
  Video, MapPin, TrendingUp, Lightbulb, Heart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UADBLogo } from '@/components/UADBLogo';

export default function Landing() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const ctaLink = user ? '/app' : '/signup';
  const ctaLabel = user ? 'Accéder à la plateforme' : 'Commencer maintenant';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UADBLogo size={36} />
            <span className="font-bold text-slate-900 text-lg">MentorUADB</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}>Fonctionnalités</a>
            <a href="#how" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}>Comment ça marche</a>
            <a href="#uadb" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}>L'UADB</a>
            <a href="#temoignages" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}>Témoignages</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/app" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
                Tableau de bord <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}>Se connecter</Link>
                <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
                  Créer un compte <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileMenu(true)}>
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 inset-y-0 w-72 bg-white shadow-xl flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
              <span className="font-bold text-slate-900">Menu</span>
              <button onClick={() => setMobileMenu(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <nav className="flex-1 px-5 py-4 space-y-4">
              <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Fonctionnalités</a>
              <a href="#how" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Comment ça marche</a>
              <a href="#uadb" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">L'UADB</a>
              <a href="#temoignages" onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-slate-600">Témoignages</a>
            </nav>
            <div className="border-t border-slate-200 p-5 space-y-3">
              {!user && <Link to="/login" className="block w-full text-center py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700">Se connecter</Link>}
              <Link to={ctaLink} className="block w-full text-center py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium">{ctaLabel}</Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
          <div className="absolute top-20 -right-20 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-100 text-secondary-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Plateforme officielle de l'UADB
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                Le mentorat<br />
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">étudiant à étudiant</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Trouvez un mentor parmi vos camarades, réservez des sessions de tutorat en ligne ou en présentiel, et progressez ensemble. Conçu pour les étudiants de l'Université Alioune Diop de Bambey.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to={ctaLink} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5">
                  {ctaLabel} <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                  Comment ça marche
                </a>
              </div>
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {['A', 'M', 'F', 'S'].map((l, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-sm font-semibold text-white" style={{ background: ['#2563eb', '#059669', '#f59e0b', '#8b5cf6'][i] }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-accent-500 text-accent-500" />)}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">Rejoint par des étudiants des 4 UFR</p>
                </div>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10">
                <img
                  src="https://images.pexels.com/photos/5940710/pexels-photo-5940710.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Étudiant africain utilisant un ordinateur en classe"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>
              {/* Floating card 1 */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-56 animate-slide-up hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Session confirmée</p>
                    <p className="text-xs text-slate-500">Analyse — Aujourd'hui 14h</p>
                  </div>
                </div>
              </div>
              {/* Floating card 2 */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-slide-up hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">+27%</p>
                    <p className="text-xs text-slate-500">de réussite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Stat number="4" label="Composantes UADB" />
            <Stat number="20+" label="Matières couvertes" />
            <Stat number="2" label="Modes de session" />
            <Stat number="100%" label="Gratuit pour les étudiants" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Tout ce qu'il faut pour réussir</h2>
            <p className="mt-4 text-lg text-slate-600">Des outils pensés pour le quotidien des étudiants de l'UADB</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Search} title="Trouver un mentor" desc="Recherchez par matière, filière ou nom. Comparez les profils et choisissez le mentor qui vous correspond." color="primary" />
            <FeatureCard icon={Calendar} title="Sessions flexibles" desc="Réservez en ligne ou en présentiel. Choisissez le créneau qui vous arrange parmi les disponibilités du mentor." color="secondary" />
            <FeatureCard icon={MessageSquare} title="Messagerie intégrée" desc="Échangez avec vos mentors et mentorés directement sur la plateforme, sans donner votre numéro." color="primary" />
            <FeatureCard icon={Star} title="Évaluations" desc="Notez vos sessions et construisez la réputation des meilleurs mentors de la communauté." color="secondary" />
            <FeatureCard icon={Sparkles} title="Assistant IA" desc="Posez vos questions à notre chatbot intégré, disponible 24/7 pour vous orienter vers la bonne matière." color="primary" />
            <FeatureCard icon={ShieldCheck} title="Comptes vérifiés" desc="Tous les comptes sont validés manuellement. Seuls les vrais étudiants de l'UADB peuvent accéder." color="secondary" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 lg:py-28 bg-slate-50/50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Comment ça marche</h2>
            <p className="mt-4 text-lg text-slate-600">Trois étapes simples pour commencer</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard step="1" icon={Users} title="Créez votre compte" desc="Inscrivez-vous avec votre numéro de carte étudiante. Choisissez d'être mentoré, mentor, ou les deux. Un administrateur validera votre compte." />
            <StepCard step="2" icon={Search} title="Trouvez votre mentor" desc="Parcourez la liste des mentors par matière. Consultez leurs disponibilités, leur niveau d'expertise et leurs évaluations." />
            <StepCard step="3" icon={Calendar} title="Réservez et progressez" desc="Envoyez une demande de session, échangez via la messagerie, faites votre session et évaluez-la pour aider la communauté." />
          </div>
          <div className="text-center mt-12">
            <Link to={ctaLink} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:-translate-y-0.5">
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* UADB showcase */}
      <section id="uadb" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <UfrCard code="UFR SATIC" name="Sciences & TIC" location="Ngoundiane" subjects="Maths, Physique, Chimie, Dév. Web, Réseau, Multimédia" color="from-primary-500 to-primary-700" />
                <UfrCard code="UFR SDD" name="Santé & Dév. Durable" location="Diourbel" subjects="Santé communautaire, Environnement" color="from-secondary-500 to-secondary-700" />
                <UfrCard code="UFR ECOMIJ" name="Éco & Droit" location="Bambey" subjects="Économie, Finance, Management, Droit" color="from-accent-500 to-accent-600" />
                <UfrCard code="ISFAR" name="Agronomie" location="Bambey" subjects="Agriculture, Élevage, Foresterie, Génie Rural" color="from-primary-600 to-secondary-600" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" /> L'Université Alioune Diop de Bambey
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Une communauté, quatre composantes</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                MentorUADB couvre toutes les filières de l'UADB. Que vous soyez en Sciences, en Économie, en Santé ou en Agronomie, vous trouverez un mentor dans votre domaine.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Toutes les matières des 4 composantes',
                  "Mentors classés par niveau d'expertise",
                  'Sessions adaptées à votre campus (Bambey, Ngoundiane, Diourbel)',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-600 shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Session modes */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Choisissez votre mode de session</h2>
              <p className="mt-4 text-lg text-slate-300">Adapter le tutorat à votre emploi du temps et votre campus</p>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">En ligne</h3>
                    <p className="text-slate-400 mt-1">Connectez-vous depuis chez vous via un lien visio. Idéal pour les étudiants des différents campus de l'UADB.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">En présentiel</h3>
                    <p className="text-slate-400 mt-1">Retrouvez-vous à la bibliothèque, en salle de cours ou sur le campus. Indiquez simplement le lieu lors de la réservation.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/5940828/pexels-photo-5940828.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Étudiants africains en session de mentorat"
                className="rounded-3xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Ils ont essayé MentorUADB</h2>
            <p className="mt-4 text-lg text-slate-600">Les premiers retours de la communauté étudiante</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard name="Awa Diop" role="L2 Informatique — UFR SATIC" text="J'étais perdue en algorithmique. J'ai trouvé un mentor en 2 minutes et on a fait une session le soir même. J'ai enfin compris les pointeurs !" initials="AD" color="#2563eb" />
            <TestimonialCard name="Mamadou Sarr" role="L1 Économie — UFR ECOMIJ" text="Le système de disponibilités est génial. Je vois tout de suite quand mon mentor est libre, je réserve et c'est fait. Plus besoin de courir après les gens." initials="MS" color="#059669" />
            <TestimonialCard name="Fatou Ndiaye" role="L3 Santé — UFR SDD" text="Devenir mentor m'a permis de réviser en enseignant. Les évaluations me motivent à donner le meilleur. La plateforme est intuitive et belle." initials="FN" color="#f59e0b" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium mb-6">
                <Heart className="w-4 h-4" /> Gratuit pour tous les étudiants
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Prêt à rejoindre la communauté ?</h2>
              <p className="mt-4 text-lg text-primary-100 max-w-xl mx-auto">
                Créez votre compte en moins de 2 minutes et trouvez votre premier mentor dès aujourd'hui.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <Link to={ctaLink} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary-700 font-semibold hover:bg-slate-50 transition-all shadow-lg hover:-translate-y-0.5">
                  {ctaLabel} <ArrowRight className="w-5 h-5" />
                </Link>
                {!user && (
                  <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                    J'ai déjà un compte
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <UADBLogo size={32} />
                <span className="font-bold text-slate-900">MentorUADB</span>
              </div>
              <p className="text-sm text-slate-500">La plateforme de mentorat étudiant de l'Université Alioune Diop de Bambey.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Plateforme</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-primary-600 transition-colors">Fonctionnalités</a></li>
                <li><a href="#how" className="hover:text-primary-600 transition-colors">Comment ça marche</a></li>
                <li><a href="#uadb" className="hover:text-primary-600 transition-colors">L'UADB</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Composantes</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>UFR SATIC — Ngoundiane</li>
                <li>UFR SDD — Diourbel</li>
                <li>UFR ECOMIJ — Bambey</li>
                <li>ISFAR — Bambey</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>Université Alioune Diop de Bambey</li>
                <li>Bambey, Sénégal</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 MentorUADB. Tous droits réservés.</p>
            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              Fait avec <Heart className="w-3.5 h-3.5 text-error-500 fill-error-500" /> pour les étudiants de l'UADB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-slate-900">{number}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
    secondary: 'bg-secondary-50 text-secondary-600 group-hover:bg-secondary-600 group-hover:text-white',
  };
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, desc }: { step: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shadow-md">{step}</div>
      <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 mt-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function UfrCard({ code, name, location, subjects, color }: { code: string; name: string; location: string; subjects: string; color: string }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden h-48 cursor-default">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
      <div className="absolute inset-0 bg-slate-900/10" />
      <div className="relative h-full p-5 flex flex-col justify-between text-white">
        <div>
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide">{code}</p>
          <h3 className="font-bold text-lg mt-1 leading-tight">{name}</h3>
        </div>
        <div>
          <p className="text-xs text-white/80 mb-1">{subjects}</p>
          <p className="text-xs font-medium text-white/90 flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, text, initials, color }: { name: string; role: string; text: string; initials: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-accent-500 text-accent-500" />)}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">"{text}"</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: color }}>{initials}</div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
