/**
 * Send Notification Edge Function — MentorUADB
 *
 * Crée une notification interne et, si RESEND_API_KEY est configuré,
 * envoie également un email au destinataire.
 *
 * POST /functions/v1/send-notification
 * Body: {
 *   destinataire_id: string (UUID),
 *   type: string (enum NotifType),
 *   titre: string,
 *   contenu: string,
 *   lien?: string,
 *   entite_type?: string,
 *   entite_id?: string (UUID)
 * }
 * Auth: Bearer JWT requis (service role ou utilisateur authentifié)
 *
 * §20 Cahier des charges — Notifications
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("send-notification");

const RATE_MAX = 60;
const RATE_WINDOW_MS = 60_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TYPES = [
  "nouvelle_demande", "demande_acceptee", "demande_refusee", "demande_modif",
  "nouveau_message", "session_programmee", "rappel_session",
  "session_annulee", "session_terminee", "nouvelle_evaluation",
  "compte_valide", "compte_suspendu", "info",
] as const;

type NotifType = (typeof VALID_TYPES)[number];

type NotifPayload = {
  destinataire_id: string;
  type: NotifType;
  titre: string;
  contenu: string;
  lien?: string;
  entite_type?: string;
  entite_id?: string;
};

function validateBody(raw: unknown): { ok: true; payload: NotifPayload } | { ok: false; status: number; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;

  if (!obj.destinataire_id || typeof obj.destinataire_id !== "string" || !UUID_RE.test(obj.destinataire_id)) {
    return { ok: false, status: 422, error: "'destinataire_id' doit être un UUID valide" };
  }
  if (!obj.type || typeof obj.type !== "string" || !(VALID_TYPES as readonly string[]).includes(obj.type)) {
    return { ok: false, status: 422, error: `'type' doit être l'une des valeurs: ${VALID_TYPES.join(", ")}` };
  }
  if (!obj.titre || typeof obj.titre !== "string" || obj.titre.trim().length === 0) {
    return { ok: false, status: 422, error: "'titre' est requis et ne peut pas être vide" };
  }
  if (obj.titre.length > 150) {
    return { ok: false, status: 422, error: "'titre' dépasse 150 caractères" };
  }
  if (!obj.contenu || typeof obj.contenu !== "string" || obj.contenu.trim().length === 0) {
    return { ok: false, status: 422, error: "'contenu' est requis et ne peut pas être vide" };
  }
  if (obj.contenu.length > 1000) {
    return { ok: false, status: 422, error: "'contenu' dépasse 1000 caractères" };
  }
  if (obj.entite_id !== undefined && obj.entite_id !== null) {
    if (typeof obj.entite_id !== "string" || !UUID_RE.test(obj.entite_id)) {
      return { ok: false, status: 422, error: "'entite_id' doit être un UUID valide" };
    }
  }

  return {
    ok: true,
    payload: {
      destinataire_id: obj.destinataire_id,
      type: obj.type as NotifType,
      titre: obj.titre.trim(),
      contenu: obj.contenu.trim(),
      lien: typeof obj.lien === "string" ? obj.lien : undefined,
      entite_type: typeof obj.entite_type === "string" ? obj.entite_type : undefined,
      entite_id: typeof obj.entite_id === "string" ? obj.entite_id : undefined,
    },
  };
}

/** Envoie un email via Resend API si la clé est configurée */
async function sendEmail(
  toEmail: string,
  toName: string,
  titre: string,
  contenu: string,
  lien?: string,
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    log.info("Email ignoré (RESEND_API_KEY non configuré)");
    return;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🎓 MentorUADB</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0;">Plateforme de mentorat académique — UADB</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin-top: 0;">${titre}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${contenu}</p>
        ${lien ? `<a href="https://uadb.edu.sn${lien}" style="display:inline-block; background:#667eea; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px; font-weight:600;">Voir sur MentorUADB →</a>` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Vous recevez cet email car vous êtes inscrit(e) sur la plateforme MentorUADB
          de l'Université Alioune Diop de Bambey.
        </p>
      </div>
    </div>
  `;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MentorUADB <noreply@uadb.edu.sn>",
        to: [{ email: toEmail, name: toName }],
        subject: `[MentorUADB] ${titre}`,
        html: htmlBody,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      log.warn("Erreur envoi email Resend", { status: resp.status, body: text.slice(0, 300) });
    } else {
      log.info("Email envoyé via Resend", { to: toEmail });
    }
  } catch (err) {
    log.warn("Exception lors de l'envoi email", { error: String(err) });
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsOptionsResponse(req);
  if (req.method !== "POST") {
    return errorResponse("Méthode non autorisée. Utilisez POST.", 405, { ...corsHeaders, Allow: "POST" });
  }

  const auth = await verifyAuth(req);
  if (!auth.ok) {
    log.warn("Auth échouée", { status: auth.status });
    return errorResponse(auth.error, auth.status, corsHeaders);
  }

  const rl = rateLimit(`notif:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    log.warn("Rate limit dépassé", { userId: auth.userId });
    return errorResponse("Trop de requêtes.", 429, corsHeaders, undefined, rateLimitHeaders(0, rl.resetAt));
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Corps de requête JSON invalide", 400, corsHeaders);
  }

  const parsed = validateBody(rawBody);
  if (!parsed.ok) {
    return errorResponse(parsed.error, parsed.status, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }

  const { payload } = parsed;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Vérifier que le destinataire existe
    const { data: dest, error: destErr } = await supabase
      .from("profiles")
      .select("id, nom, prenom")
      .eq("id", payload.destinataire_id)
      .maybeSingle();

    if (destErr) throw destErr;
    if (!dest) {
      return errorResponse("Destinataire introuvable", 404, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // Insérer la notification en base
    const { data: notif, error: insertErr } = await supabase
      .from("notifications")
      .insert({
        destinataire_id: payload.destinataire_id,
        expediteur_id: auth.userId,
        type: payload.type,
        titre: payload.titre,
        contenu: payload.contenu,
        lien: payload.lien ?? null,
        entite_type: payload.entite_type ?? null,
        entite_id: payload.entite_id ?? null,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    log.info("Notification créée", { notif_id: notif.id, type: payload.type, destinataire: payload.destinataire_id });

    // Récupérer l'email du destinataire pour envoi optionnel
    const { data: authUser } = await supabase.auth.admin.getUserById(payload.destinataire_id);
    if (authUser?.user?.email) {
      const nomComplet = `${dest.prenom} ${dest.nom}`.trim();
      // Lancer l'envoi email en arrière-plan (ne bloque pas la réponse)
      sendEmail(authUser.user.email, nomComplet, payload.titre, payload.contenu, payload.lien).catch(() => {});
    }

    return jsonResponse(
      { success: true, notification_id: notif.id },
      201,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur send-notification", { error: String(err) });
    return errorResponse("Erreur interne lors de l'envoi de la notification", 500, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }
});
