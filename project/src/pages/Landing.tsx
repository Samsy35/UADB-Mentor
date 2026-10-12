import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Heart,
  Lightbulb,
  MapPin,
  Menu,
  MessageSquare,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UADBLogo } from '@/components/UADBLogo';

const heroImage = 'https://images.pexels.com/photos/5940710/pexels-photo-5940710.jpeg?auto=compress&cs=tinysrgb&w=1400';
const mentorImage = 'https://images.pexels.com/photos/5940828/pexels-photo-5940828.jpeg?auto=compress&cs=tinysrgb&w=1200';
const studyImage = 'https://images.pexels.com/photos/5905445/pexels-photo-5905445.jpeg?auto=compress&cs=tinysrgb&w=1000';

export default function Landing() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Visitors create an account; authenticated users go straight to the app.
  const ctaLink = user ? '/app' : '/signup';
  const ctaLabel = user ? 'Accéder au tableau de bord' : 'Commencer gratuitement';

  const navItems = [
    ['#features', 'Fonctionnalités'],
    ['#how', 'Comment ça marche'],
    ['#uadb', "L'UADB"],
    ['#temoignages', 'Témoignages'],
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl'
            : 'bg-white/60 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="MentorUADB accueil">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
              <UADBLogo size={38} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight">Mentor<span className="text-primary-600">UADB</span></div>
              <div className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">Mentorat étudiant</div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-600 transition hover:text-primary-600">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link to="/app" className="group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700">
                Tableau de bord <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-primary-600">Se connecter</Link>
                <Link to="/signup" className="group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700">
                  Créer un compte <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button aria-label="Fermer le menu" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-2xl">
            <div className="flex h-[76px] items-center justify-between border-b border-slate-200 px-5">
              <div className="flex items-center gap-2.5 font-bold"><UADBLogo size={34} /> Mentor<span className="text-primary-600">UADB</span></div>
              <button type="button" onClick={() => setMobileMenu(false)} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 space-y-1 p-5">
              {navItems.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileMenu(false)} className="flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {label}<ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              ))}
            </nav>
            <div className="space-y-3 border-t border-slate-200 p-5">
              {!user && <Link to="/login" onClick={() => setMobileMenu(false)} className="block rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700">Se connecter</Link>}
              <Link to={ctaLink} onClick={() => setMobileMenu(false)} className="block rounded-xl bg-primary-600 py-3 text-center text-sm font-semibold text-white">{ctaLabel}</Link>
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {/* Hero */}
        <section className="relative isolate overflow-hidden pt-28 lg:pt-36">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.13),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#fff_72%)]" />
          <div className="absolute -right-40 top-20 -z-10 h-96 w-96 rounded-full bg-primary-200/25 blur-3xl" />
          <div className="absolute -left-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-secondary-200/25 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
            <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-700 shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-secondary-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  Mentorat étudiant à l'UADB
                </div>
                <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[76px]">
                  Apprenez mieux.
                  <span className="mt-2 block bg-gradient-to-r from-primary-600 via-blue-500 to-secondary-500 bg-clip-text text-transparent">Ensemble.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Trouvez rapidement le bon mentor, réservez une session adaptée à votre rythme et progressez avec une communauté d'étudiants de l'Université Alioune Diop de Bambey.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link to={ctaLink} className="group inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-primary-600/25 transition hover:-translate-y-1 hover:bg-primary-700">
                    {ctaLabel} <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </Link>
                  <a href="#how" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
                    <Play className="h-4 w-4 fill-current" /> Découvrir la plateforme
                  </a>
                </div>
                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary-600" /> Comptes vérifiés</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary-600" /> Sessions flexibles</div>
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary-600" /> Gratuit pour les étudiants</div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
                <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-br from-primary-200/40 via-transparent to-secondary-200/40 blur-2xl" />
                <div className="relative grid grid-cols-[1.35fr_0.8fr] gap-3 sm:gap-4">
                  <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-slate-100 shadow-2xl shadow-slate-900/15">
                    <img src={heroImage} alt="Étudiants travaillant ensemble" className="h-[430px] w-full object-cover sm:h-[520px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><GraduationCap className="h-5 w-5" /></div>
                        <div><p className="text-sm font-bold">Une communauté qui avance</p><p className="text-xs text-white/75">Des étudiants, pour des étudiants.</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="relative overflow-hidden rounded-[26px] border border-white bg-white shadow-xl shadow-slate-900/10">
                      <img src={studyImage} alt="Étudiante en séance de travail" className="h-[205px] w-full object-cover sm:h-[250px]" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">+20 matières</div>
                    </div>
                    <div className="flex-1 rounded-[26px] bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15 sm:p-6">
                      <div className="flex items-center gap-2 text-secondary-300"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Mentorat intelligent</span></div>
                      <p className="mt-4 text-2xl font-black tracking-tight">Le bon mentor, au bon moment.</p>
                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {['AD', 'MS', 'FN'].map((initials) => <div key={initials} className="grid h-8 w-8 place-items-center rounded-full border-2 border-slate-950 bg-primary-500 text-[9px] font-bold text-white">{initials}</div>)}
                        </div>
                        <span className="text-xs text-slate-400">Communauté UADB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:block lg:-left-10">
                  <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary-50 text-secondary-600"><CheckCircle2 className="h-5 w-5" /></div><div><p className="text-xs font-bold text-slate-900">Session confirmée</p><p className="mt-0.5 text-[11px] text-slate-500">Analyse · Aujourd'hui 14h</p></div></div>
                </div>
                <div className="absolute -right-3 top-8 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:block lg:-right-8">
                  <div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600"><Star className="h-4 w-4 fill-current" /></div><div><p className="text-sm font-black">4.9/5</p><p className="text-[10px] text-slate-500">Satisfaction</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:px-6 lg:grid-cols-4 lg:divide-y-0 lg:px-8">
            <Stat number="4" label="composantes UADB" icon={GraduationCap} />
            <Stat number="20+" label="matières couvertes" icon={BookOpen} />
            <Stat number="2" label="modes de session" icon={Video} />
            <Stat number="100%" label="gratuit pour les étudiants" icon={Heart} />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Une plateforme pensée pour vous" title="Tout ce qu'il faut pour progresser" description="De la recherche du mentor jusqu'à l'évaluation de la session, MentorUADB rassemble les outils essentiels dans une seule expérience." />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard icon={Search} title="Trouver un mentor" desc="Filtrez par matière, filière, niveau et disponibilité pour identifier rapidement le profil qui vous correspond." tone="blue" />
              <FeatureCard icon={Calendar} title="Sessions flexibles" desc="Choisissez un créneau et un format en ligne ou en présentiel selon vos contraintes." tone="green" />
              <FeatureCard icon={MessageSquare} title="Messagerie intégrée" desc="Échangez avant et après les sessions dans un espace privé, simple et centralisé." tone="violet" />
              <FeatureCard icon={Star} title="Évaluations" desc="Partagez votre expérience et construisez une réputation utile pour toute la communauté." tone="amber" />
              <FeatureCard icon={Sparkles} title="Assistant IA" desc="Obtenez une première orientation, identifiez la matière pertinente et préparez votre session." tone="indigo" />
              <FeatureCard icon={ShieldCheck} title="Comptes vérifiés" desc="Un cadre sécurisé avec des profils validés pour favoriser des échanges académiques de confiance." tone="emerald" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-slate-200 bg-slate-50/70 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Simple et rapide" title="Comment ça marche ?" description="Trois étapes pour passer d'une difficulté académique à un accompagnement concret." />
            <div className="relative mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
              <StepCard step="01" icon={Users} title="Créez votre profil" desc="Indiquez votre filière, votre niveau et les matières dans lesquelles vous souhaitez être accompagné ou accompagner." />
              <StepCard step="02" icon={Search} title="Trouvez le bon mentor" desc="Comparez les profils, disponibilités et évaluations, puis choisissez la personne qui correspond à votre besoin." />
              <StepCard step="03" icon={Calendar} title="Réservez et progressez" desc="Échangez, planifiez la session, travaillez ensemble et laissez une évaluation après l'accompagnement." />
            </div>
            <div className="mt-12 text-center"><Link to={ctaLink} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700">{ctaLabel}<ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        {/* UADB */}
        <section id="uadb" className="scroll-mt-20 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid grid-cols-2 gap-4">
                <UfrCard code="UFR SATIC" name="Sciences & TIC" location="Ngoundiane" subjects="Maths · Physique · Chimie · TIC" tone="blue" />
                <UfrCard code="UFR SDD" name="Santé & Développement Durable" location="Diourbel" subjects="Santé · Environnement" tone="green" />
                <UfrCard code="UFR ECOMIJ" name="Économie & Management" location="Bambey" subjects="Économie · Finance · Droit" tone="amber" />
                <UfrCard code="ISFAR" name="Agronomie" location="Bambey" subjects="Agriculture · Élevage · Génie rural" tone="violet" />
              </div>
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-primary-700"><BookOpen className="h-4 w-4" /> L'Université Alioune Diop de Bambey</div>
                <h2 className="text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">Une communauté, quatre composantes.</h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">MentorUADB crée un pont entre les étudiants de l'UADB pour partager les compétences, réduire l'isolement académique et rendre l'entraide plus accessible.</p>
                <div className="mt-8 space-y-4">
                  {['Une recherche de mentor adaptée à votre niveau', 'Des sessions compatibles avec les différents campus', 'Un cadre structuré pour les mentors et les mentorés'].map((item) => <div key={item} className="flex items-center gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary-50 text-secondary-600"><CheckCircle2 className="h-4 w-4" /></div><span className="font-medium text-slate-700">{item}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Session modes */}
        <section className="relative overflow-hidden bg-slate-950 py-24 text-white lg:py-32">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-secondary-600/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300"><Sparkles className="h-4 w-4 text-secondary-300" /> Votre rythme, votre format</div>
              <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">Le mentorat s'adapte à votre quotidien.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Choisissez le mode qui vous convient et concentrez-vous sur l'essentiel : apprendre, pratiquer et progresser.</p>
              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                <ModeCard icon={Video} title="En ligne" desc="Travaillez à distance avec un lien de visioconférence." />
                <ModeCard icon={MapPin} title="En présentiel" desc="Retrouvez votre mentor sur un lieu convenu du campus." />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-2 shadow-2xl">
              <img src={mentorImage} alt="Étudiants en session de mentorat" className="h-[390px] w-full rounded-[26px] object-cover sm:h-[470px]" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary-500/20 text-secondary-300"><Lightbulb className="h-5 w-5" /></div><div><p className="text-sm font-bold">Un accompagnement qui reste humain</p><p className="text-xs text-slate-400">Échange, confiance et progression.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="temoignages" className="scroll-mt-20 border-b border-slate-200 bg-slate-50/60 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="La voix des étudiants" title="L'entraide devient plus simple" description="Une expérience conçue pour rendre le partage de connaissances naturel, structuré et accessible." />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <TestimonialCard name="Awa Diop" role="L2 Informatique · UFR SATIC" text="J'ai trouvé un mentor adapté à mon niveau sans passer par plusieurs groupes WhatsApp. La réservation m'a permis de planifier directement une session." initials="AD" tone="blue" />
              <TestimonialCard name="Mamadou Sarr" role="L1 Économie · UFR ECOMIJ" text="Je vois les disponibilités de mon mentor et je peux préparer mes questions avant la séance. C'est beaucoup plus organisé." initials="MS" tone="green" />
              <TestimonialCard name="Fatou Ndiaye" role="L3 Santé · UFR SDD" text="Devenir mentor donne un vrai cadre à l'entraide. Les échanges sont plus simples et les évaluations encouragent la qualité." initials="FN" tone="amber" />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-gradient-to-br from-primary-600 via-primary-700 to-slate-950 px-6 py-16 text-center shadow-2xl shadow-primary-900/20 sm:px-12">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-secondary-400/15 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"><GraduationCap className="h-6 w-6" /></div>
              <h2 className="text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl">Votre prochaine difficulté peut devenir votre prochaine réussite.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-primary-100">Rejoignez MentorUADB, trouvez une personne qui maîtrise la matière et avancez avec un accompagnement adapté.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link to={ctaLink} className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-primary-700 shadow-xl transition hover:-translate-y-1 hover:bg-slate-50">{ctaLabel}<ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></Link>
                {!user && <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10">J'ai déjà un compte</Link>}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3"><UADBLogo size={36} /><span className="text-lg font-black">Mentor<span className="text-primary-600">UADB</span></span></div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">La plateforme de mentorat étudiant pensée pour faciliter l'entraide académique au sein de l'Université Alioune Diop de Bambey.</p>
            </div>
            <FooterColumn title="Plateforme" links={navItems.map(([href, label]) => [href, label])} />
            <div><h3 className="text-sm font-bold text-slate-900">Composantes</h3><ul className="mt-4 space-y-2.5 text-sm text-slate-500"><li>UFR SATIC</li><li>UFR SDD</li><li>UFR ECOMIJ</li><li>ISFAR</li></ul></div>
            <div><h3 className="text-sm font-bold text-slate-900">Accès</h3><ul className="mt-4 space-y-2.5 text-sm text-slate-500"><li><Link to={user ? '/app' : '/signup'} className="transition hover:text-primary-600">{user ? 'Tableau de bord' : 'Créer un compte'}</Link></li><li><Link to="/login" className="transition hover:text-primary-600">Se connecter</Link></li></ul></div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 MentorUADB. Tous droits réservés.</p><p className="flex items-center gap-1.5">Fait avec <Heart className="h-3.5 w-3.5 fill-current text-rose-500" /> pour les étudiants de l'UADB</p></div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary-600">{eyebrow}</div>
      <h2 className="text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function Stat({ number, label, icon: Icon }: { number: string; label: string; icon: React.ElementType }) {
  return <div className="group flex items-center justify-center gap-3 px-3 py-7 sm:py-9"><div className="hidden h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600 sm:grid"><Icon className="h-5 w-5" /></div><div><p className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{number}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p></div></div>;
}

const toneStyles: Record<string, { icon: string; hover: string }> = {
  blue: { icon: 'bg-primary-50 text-primary-600', hover: 'group-hover:bg-primary-600 group-hover:text-white' },
  green: { icon: 'bg-secondary-50 text-secondary-600', hover: 'group-hover:bg-secondary-600 group-hover:text-white' },
  violet: { icon: 'bg-violet-50 text-violet-600', hover: 'group-hover:bg-violet-600 group-hover:text-white' },
  amber: { icon: 'bg-amber-50 text-amber-600', hover: 'group-hover:bg-amber-500 group-hover:text-white' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', hover: 'group-hover:bg-indigo-600 group-hover:text-white' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', hover: 'group-hover:bg-emerald-600 group-hover:text-white' },
};

function FeatureCard({ icon: Icon, title, desc, tone }: { icon: React.ElementType; title: string; desc: string; tone: string }) {
  const style = toneStyles[tone];
  return <article className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/8"><div className={`mb-6 grid h-12 w-12 place-items-center rounded-2xl transition-colors ${style.icon} ${style.hover}`}><Icon className="h-5 w-5" /></div><h3 className="text-lg font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p><div className="mt-5 flex items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-primary-600">En savoir plus <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></div></article>;
}

function StepCard({ step, icon: Icon, title, desc }: { step: string; icon: React.ElementType; title: string; desc: string }) {
  return <article className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600"><Icon className="h-5 w-5" /></div><span className="text-5xl font-black tracking-[-0.05em] text-slate-100">{step}</span></div><h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p></article>;
}

function UfrCard({ code, name, location, subjects, tone }: { code: string; name: string; location: string; subjects: string; tone: string }) {
  const gradients: Record<string, string> = { blue: 'from-primary-600 to-primary-800', green: 'from-secondary-500 to-secondary-800', amber: 'from-amber-500 to-orange-600', violet: 'from-violet-600 to-indigo-800' };
  return <article className={`group relative min-h-[190px] overflow-hidden rounded-3xl bg-gradient-to-br ${gradients[tone]} p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl`}><div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" /><div className="relative flex h-full flex-col justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">{code}</p><h3 className="mt-2 text-lg font-black leading-tight">{name}</h3></div><div><p className="text-xs leading-5 text-white/75">{subjects}</p><p className="mt-3 flex items-center gap-1 text-xs font-bold text-white/90"><MapPin className="h-3.5 w-3.5" /> {location}</p></div></div></article>;
}

function ModeCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>;
}

function TestimonialCard({ name, role, text, initials, tone }: { name: string; role: string; text: string; initials: string; tone: string }) {
  const avatar = { blue: 'bg-primary-600', green: 'bg-secondary-600', amber: 'bg-amber-500' }[tone] ?? 'bg-primary-600';
  return <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div><p className="mt-5 text-[15px] leading-7 text-slate-700">“{text}”</p><div className="mt-7 flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-full text-xs font-black text-white ${avatar}`}>{initials}</div><div><p className="text-sm font-bold text-slate-950">{name}</p><p className="mt-0.5 text-xs text-slate-500">{role}</p></div></div></article>;
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <div><h3 className="text-sm font-bold text-slate-900">{title}</h3><ul className="mt-4 space-y-2.5 text-sm text-slate-500">{links.map(([href, label]) => <li key={href}><a href={href} className="transition hover:text-primary-600">{label}</a></li>)}</ul></div>;
}
