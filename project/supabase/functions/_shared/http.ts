/**
 * Standardized JSON response helpers with proper status codes.
 */
export function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  extra?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extra,
    },
  });
}

export function errorResponse(
  error: string,
  status: number,
  corsHeaders: Record<string, string>,
  details?: unknown,
  extra?: Record<string, string>,
): Response {
  const body: Record<string, unknown> = { error };
  if (details !== undefined) body.details = details;
  return jsonResponse(body, status, corsHeaders, extra);
}
