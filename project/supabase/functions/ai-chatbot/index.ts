/**
 * AI Chatbot Edge Function — MentorUADB
 *
 * Validates JWT, enforces rate limiting, validates input, returns structured
 * errors (400/401/422/429/500), logs in structured JSON, restricts CORS to the frontend.
 *
 * POST /functions/v1/ai-chatbot
 * Body: { "message": string, "history"?: Array<{role: "user"|"assistant", content: string}> }
 * Auth: Bearer JWT required
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("ai-chatbot");

const SYSTEM_PROMPT = `Tu es l'assistant IA de MentorUADB, la plateforme de mentorat académique de l'Université Alioune Diop de Bambey (UADB) au Sénégal.

Ton rôle :
- Répondre aux questions fréquentes sur le fonctionnement de la plateforme
- Aider les étudiants à formuler leur demande (ex: "je ne comprends pas les intégrales" → orienter vers "Analyse Mathématique")
- Orienter vers un mentor disponible si la question nécessite un accompagnement
- Donner des conseils méthodologiques de révision et d'organisation
- Expliquer les nouvelles fonctionnalités (demandes, suivi, ressources, notifications)

Informations sur l'UADB :
- UFR SATIC (Ngoundiane) : Mathématiques, Physique, Chimie, TIC (Développement Web, Administration Réseau, Création Multimédia)
- UFR SDD (Diourbel) : Santé Communautaire, Développement Durable et Environnement
- UFR ECOMIJ (Bambey) : Économie, Finance-Comptabilité, Management, Ingénierie Juridique
- ISFAR (Bambey) : Agriculture, Élevage, Foresterie, Génie Rural
- École Doctorale EDSTSS : Doctorats pluridisciplinaires

Fonctionnement complet de la plateforme :

1. INSCRIPTION & PROFIL
   - Créer un compte avec rôle mentoré, mentor, ou les deux
   - Renseigner : niveau (L1→M2), filière, photo, téléphone
   - Mentors : ajouter matières maîtrisées, niveau d'expertise, disponibilités, mode (présentiel/en ligne)
   - Les mentors sont validés par un administrateur avant de pouvoir recevoir des demandes

2. RECHERCHE DE MENTOR (matching)
   - Aller dans « Trouver un mentor »
   - Filtrer par matière, niveau, filière, disponibilité, mode
   - Le système calcule un score de compatibilité basé sur : matière (35%), niveau adapté (20%), disponibilité (20%), compétence (15%), évaluation (10%)
   - Consulter le profil détaillé du mentor avant d'envoyer une demande

3. DEMANDES DE MENTORAT
   - Envoyer une demande au mentor en précisant : matière, difficulté rencontrée, objectif, fréquence souhaitée, durée, mode
   - Le mentor peut accepter, refuser, ou demander une modification
   - L'étudiant reçoit une notification de la réponse
   - Un étudiant peut avoir plusieurs mentors pour des matières différentes

4. MESSAGERIE
   - Échanger avec son mentor via la messagerie intégrée
   - La messagerie est limitée aux utilisateurs ayant une demande ou session active

5. PLANIFICATION DES SÉANCES
   - Programmer une séance avec date, heure, durée, thème, lieu/lien
   - Statuts : demandée → acceptée → confirmée → en cours → terminée
   - Rappels automatiques par notification

6. SUIVI ACADÉMIQUE (rapport post-séance)
   - Après chaque séance, le mentor renseigne : sujet traité, notions abordées, difficultés observées, recommandations, objectif suivant
   - L'étudiant indique son niveau de compréhension (incompris / partiellement / bien compris / très bien compris)
   - L'historique de progression est conservé

7. RESSOURCES PÉDAGOGIQUES
   - Les mentors peuvent partager des PDF, exercices, fiches, liens, annales, corrections
   - Les ressources sont associées à une matière et un niveau
   - Certaines ressources sont publiques, d'autres réservées aux étudiants du mentor

8. ÉVALUATION
   - Après une séance terminée, l'étudiant évalue le mentor sur 5 critères : qualité pédagogique, ponctualité, clarté des explications, disponibilité, satisfaction générale
   - Note globale calculée automatiquement (1 à 5 étoiles)
   - Commentaire optionnel

9. NOTIFICATIONS
   - Notifications internes pour : nouvelles demandes, réponses, nouveaux messages, séances programmées/annulées/terminées, évaluations
   - Emails optionnels si configurés

10. SIGNALEMENTS
    - Signaler un comportement ou contenu inapproprié
    - L'administrateur traite les signalements et peut suspendre des comptes

RÈGLES IMPORTANTES :
- Un mentor doit être validé par l'admin avant de recevoir des demandes (RG02)
- Un mentor suspendu ne peut plus recevoir de demandes (RG07)
- Un étudiant peut avoir plusieurs mentors pour des matières différentes (RG10)
- Les évaluations ne concernent que les séances terminées (RG05)

Réponds toujours en français, de manière concise et bienveillante. Si la question porte sur un cours précis, encourage l'étudiant à prendre une session avec un mentor dans la matière correspondante.`;

const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY = 10;
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;

type ChatTurn = { role: "user" | "assistant"; content: string };

function validateBody(raw: unknown): { ok: true; message: string; history: ChatTurn[] } | { ok: false; status: number; error: string; details?: unknown } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;
  const message = obj.message;
  if (message === undefined || message === null) {
    return { ok: false, status: 400, error: "Le champ 'message' est requis" };
  }
  if (typeof message !== "string") {
    return { ok: false, status: 422, error: "Le champ 'message' doit être une chaîne de caractères" };
  }
  if (message.trim().length === 0) {
    return { ok: false, status: 422, error: "Le champ 'message' ne peut pas être vide" };
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return { ok: false, status: 422, error: `Le champ 'message' dépasse la longueur maximale (${MAX_MESSAGE_LEN} caractères)` };
  }

  let history: ChatTurn[] = [];
  if (obj.history !== undefined && obj.history !== null) {
    if (!Array.isArray(obj.history)) {
      return { ok: false, status: 422, error: "Le champ 'history' doit être un tableau" };
    }
    if (obj.history.length > MAX_HISTORY) {
      return { ok: false, status: 422, error: `Le champ 'history' dépasse ${MAX_HISTORY} entrées` };
    }
    for (let i = 0; i < obj.history.length; i++) {
      const h = obj.history[i] as Record<string, unknown>;
      if (!h || typeof h !== "object" || typeof h.role !== "string" || typeof h.content !== "string") {
        return { ok: false, status: 422, error: `Entrée history[${i}] invalide: 'role' et 'content' doivent être des chaînes` };
      }
      if (h.role !== "user" && h.role !== "assistant") {
        return { ok: false, status: 422, error: `history[${i}].role doit être 'user' ou 'assistant'` };
      }
      if (typeof h.content !== "string" || h.content.length > MAX_MESSAGE_LEN) {
        return { ok: false, status: 422, error: `history[${i}].content dépasse la longueur maximale` };
      }
      history.push({ role: h.role, content: h.content });
    }
  }
  return { ok: true, message: message.trim(), history };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsOptionsResponse(req);
  if (req.method !== "POST") {
    return errorResponse("Méthode non autorisée. Utilisez POST.", 405, { ...corsHeaders, "Allow": "POST" });
  }

  const auth = await verifyAuth(req);
  if (!auth.ok) {
    log.warn("Auth échouée", { status: auth.status });
    return errorResponse(auth.error, auth.status, corsHeaders);
  }

  const rl = rateLimit(`chatbot:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    log.warn("Rate limit dépassé", { userId: auth.userId });
    return errorResponse(
      "Trop de requêtes. Réessayez dans un instant.",
      429,
      corsHeaders,
      undefined,
      rateLimitHeaders(0, rl.resetAt),
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Corps de requête JSON invalide", 400, corsHeaders);
  }

  const parsed = validateBody(rawBody);
  if (!parsed.ok) {
    log.warn("Validation échouée", { status: parsed.status, error: parsed.error });
    return errorResponse(parsed.error, parsed.status, corsHeaders, parsed.details, rateLimitHeaders(rl.remaining, rl.resetAt));
  }

  const { message, history } = parsed;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    const fallback = getFallbackResponse(message);
    log.info("Réponse fallback (pas de clé API)", { userId: auth.userId });
    return jsonResponse(
      { response: fallback, source: "rules" },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  }

  const messages: Array<{ role: string; content: string }> = [];
  for (const h of history.slice(-MAX_HISTORY)) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: "user", content: message });

  try {
    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      log.error("Erreur API Anthropic", { status: apiResponse.status, body: errText.slice(0, 500) });
      const fallback = getFallbackResponse(message);
      return jsonResponse(
        { response: fallback, source: "rules" },
        200,
        corsHeaders,
        rateLimitHeaders(rl.remaining, rl.resetAt),
      );
    }

    const data = await apiResponse.json();
    const responseText = data.content?.[0]?.text ?? "Désolé, je n'ai pas pu générer une réponse.";

    log.info("Réponse Claude", { userId: auth.userId });
    return jsonResponse(
      { response: responseText, source: "claude" },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur interne chatbot", { error: String(err) });
    return errorResponse(
      "Erreur interne du serveur",
      500,
      corsHeaders,
      undefined,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  }
});

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello") || lower.includes("bonsoir")) {
    return "Bonjour ! 👋 Je suis l'assistant MentorUADB. Je peux vous aider à comprendre la plateforme, trouver un mentor, organiser une séance, comprendre le suivi académique ou répondre à vos questions. Comment puis-je vous aider ?";
  }
  if (lower.includes("comment") && (lower.includes("marche") || lower.includes("fonctionne") || lower.includes("utiliser"))) {
    return "MentorUADB fonctionne en 5 étapes : 1) Créez votre compte. 2) Trouvez un mentor via « Trouver un mentor » (filtrez par matière, niveau, disponibilité). 3) Envoyez une demande de mentorat. 4) Une fois accepté, planifiez vos séances et échangez par messagerie. 5) Après chaque séance, le mentor renseigne un suivi et vous évaluez la séance.";
  }
  if (lower.includes("mentor") && (lower.includes("trouver") || lower.includes("chercher") || lower.includes("recherch"))) {
    return "Pour trouver un mentor : allez dans « Trouver un mentor », choisissez votre matière, puis filtrez par niveau, filière, disponibilité ou mode (présentiel/en ligne). Le système vous propose les mentors les plus compatibles avec un score calculé automatiquement.";
  }
  if (lower.includes("demande") && (lower.includes("mentorat") || lower.includes("envoyer") || lower.includes("faire"))) {
    return "Pour envoyer une demande de mentorat : consultez le profil d'un mentor et cliquez sur « Demander un mentorat ». Décrivez votre difficulté, votre objectif, la fréquence souhaitée (ex : 2 fois/semaine) et la durée. Le mentor recevra une notification et pourra accepter, refuser, ou demander des modifications.";
  }
  if (lower.includes("suivi") || lower.includes("rapport") || lower.includes("progression")) {
    return "Après chaque séance terminée, le mentor renseigne un rapport de suivi : sujet traité, notions abordées, difficultés observées, recommandations et objectif pour la prochaine séance. Vous pouvez aussi indiquer votre propre niveau de compréhension. Cela permet de construire un historique de votre progression.";
  }
  if (lower.includes("ressource") || lower.includes("document") || lower.includes("pdf") || lower.includes("fiche")) {
    return "Les mentors peuvent partager des ressources pédagogiques : PDF, exercices, fiches de révision, liens, annales, corrections. Ces ressources sont associées à une matière et un niveau. Certaines sont publiques, d'autres réservées à leurs étudiants.";
  }
  if (lower.includes("notification") || lower.includes("alerte") || lower.includes("email")) {
    return "MentorUADB vous notifie pour : une nouvelle demande reçue, une demande acceptée/refusée, un nouveau message, une séance programmée/annulée/terminée, une nouvelle évaluation. Les notifications apparaissent dans la cloche en haut de l'écran. Des emails peuvent aussi être envoyés si configurés.";
  }
  if (lower.includes("signal") || lower.includes("problème") || lower.includes("abus") || lower.includes("plainte")) {
    return "Vous pouvez signaler un comportement ou contenu inapproprié via le bouton « Signaler » présent sur les profils et les messages. L'équipe d'administration traitera votre signalement. En cas de problème grave, un compte peut être suspendu.";
  }
  if (lower.includes("session") || lower.includes("séance") || lower.includes("rendez") || lower.includes("planif")) {
    return "Une séance est planifiée après qu'une demande de mentorat soit acceptée. Choisissez la date, l'heure, la durée, le thème, et le lieu (ou lien de visio). Les statuts d'une séance sont : demandée → acceptée → confirmée → en cours → terminée. Vous serez notifié à chaque étape.";
  }
  if (lower.includes("matiere") || lower.includes("matières") || lower.includes("cours") || lower.includes("module")) {
    return "Les matières couvrent toutes les composantes de l'UADB : UFR SATIC (Maths, Physique, Chimie, TIC — Algo, Web, Réseaux), UFR SDD (Santé, Environnement), UFR ECOMIJ (Économie, Finance, Management, Droit) et ISFAR (Agriculture, Élevage, Foresterie). Allez dans « Trouver un mentor » pour voir les matières disponibles.";
  }
  if (lower.includes("inscription") || lower.includes("inscrire") || lower.includes("compte") || lower.includes("créer")) {
    return "Pour vous inscrire : cliquez sur « Créer un compte », remplissez vos informations (nom, numéro de carte étudiante, niveau, filière, téléphone) et choisissez votre rôle (mentoré, mentor, ou les deux). Un administrateur validera ensuite votre compte.";
  }
  if (lower.includes("devenir") && lower.includes("mentor")) {
    return "Pour devenir mentor : lors de l'inscription (ou dans votre profil), activez le rôle mentor. Ajoutez vos matières maîtrisées avec votre niveau d'expertise, définissez vos disponibilités hebdomadaires et votre mode préféré (présentiel/en ligne). Un administrateur validera votre profil avant que vous puissiez recevoir des demandes.";
  }
  if (lower.includes("message") || lower.includes("messagerie") || lower.includes("discuter")) {
    return "La messagerie permet d'échanger avec votre mentor ou vos mentorés. Elle est disponible uniquement entre utilisateurs ayant une demande ou séance active, pour éviter les abus. Allez dans « Messagerie » pour consulter vos conversations.";
  }
  if (lower.includes("evaluation") || lower.includes("évaluation") || lower.includes("noter") || lower.includes("avis")) {
    return "Après une séance terminée, vous pouvez évaluer votre mentor sur 5 critères : qualité pédagogique, ponctualité, clarté des explications, disponibilité et satisfaction générale. Une note globale est calculée automatiquement. Vous pouvez aussi laisser un commentaire. Cela aide à améliorer la qualité du mentorat.";
  }
  if (lower.includes("disponibil") || lower.includes("créneau") || lower.includes("horaire") || lower.includes("agenda")) {
    return "Les mentors définissent leurs disponibilités dans leur profil (jours de la semaine et créneaux horaires). Vous pouvez filtrer les mentors par disponibilité lors de votre recherche. Un mentor peut aussi définir son nombre maximum d'étudiants simultanés.";
  }
  if (lower.includes("validation") || lower.includes("valide") || lower.includes("en attente") || lower.includes("admin")) {
    return "Les comptes sont validés manuellement par les administrateurs pour s'assurer que seuls les vrais étudiants et mentors de l'UADB utilisent la plateforme. Une fois validé, vous avez accès à toutes les fonctionnalités. Si votre compte est en attente depuis longtemps, contactez l'administration.";
  }
  if (lower.includes("score") || lower.includes("matching") || lower.includes("compatib") || lower.includes("classement")) {
    return "Le score de compatibilité est calculé selon le cahier des charges : matière (35%), niveau adapté (20%), disponibilité (20%), compétence du mentor (15%), évaluation (10%). Les sous-scores sont visibles sur le profil de chaque mentor pour plus de transparence.";
  }
  if (lower.includes("uadb") || lower.includes("université") || lower.includes("bamb") || lower.includes("filière") || lower.includes("ufr")) {
    return "L'UADB (Université Alioune Diop de Bambey) compte 4 composantes : UFR SATIC (Sciences, Technologies — Ngoundiane), UFR SDD (Santé, Développement Durable — Diourbel), UFR ECOMIJ (Économie, Management, Droit — Bambey) et ISFAR (Agriculture, Élevage — Bambey). MentorUADB couvre toutes ces formations.";
  }
  if (lower.includes("integr") || lower.includes("dériv") || lower.includes("limite") || lower.includes("analyse") || lower.includes("math")) {
    return "Pour les questions de mathématiques (intégrales, dérivées, limites, algèbre), je vous recommande de trouver un mentor en Analyse Mathématique ou Algèbre Linéaire dans « Trouver un mentor ». Décrivez précisément votre difficulté dans votre demande pour un accompagnement ciblé.";
  }
  if (lower.includes("algorithme") || lower.includes("code") || lower.includes("programmation") || lower.includes("bug") || lower.includes("python") || lower.includes("java") || lower.includes("c++")) {
    return "Pour les questions de programmation et d'algorithmique, trouvez un mentor en Algorithmique ou dans votre langage (C, Java, Python, Web). Décrivez le problème précis (récursivité, complexité, bug...) dans votre demande pour que le mentor puisse bien se préparer.";
  }
  if (lower.includes("econom") || lower.includes("compta") || lower.includes("gestion") || lower.includes("management")) {
    return "Pour les matières de l'UFR ECOMIJ (Économie, Comptabilité, Management, Droit), vous trouverez des mentors dans « Trouver un mentor » en filtrant par filière ECOMIJ.";
  }
  if (lower.includes("santé") || lower.includes("sante") || lower.includes("médecine") || lower.includes("biologie")) {
    return "Pour les matières de l'UFR SDD (Santé, Environnement, Biologie), vous trouverez des mentors en filtrant par filière SDD dans « Trouver un mentor ».";
  }
  if (lower.includes("agricul") || lower.includes("elevage") || lower.includes("agronomi") || lower.includes("isfar")) {
    return "Pour les matières de l'ISFAR (Agronomie, Élevage, Foresterie, Génie Rural), filtrez par filière ISFAR dans « Trouver un mentor ».";
  }
  if (lower.includes("merci") || lower.includes("super") || lower.includes("parfait") || lower.includes("excellent")) {
    return "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. Bonne révision et bon courage dans vos études !";
  }
  if (lower.includes("limite") && lower.includes("étudiant") || lower.includes("nb max") || lower.includes("nombre max")) {
    return "Un mentor peut définir le nombre maximum d'étudiants qu'il accompagne simultanément (entre 1 et 20). Cela évite la surcharge des mentors et garantit une meilleure qualité d'accompagnement.";
  }

  return "Je ne suis pas sûr de pouvoir répondre précisément à cette question. Je vous recommande de consulter un mentor dans « Trouver un mentor » pour une aide personnalisée, ou de reformuler votre question sur le fonctionnement de la plateforme MentorUADB.";
}
