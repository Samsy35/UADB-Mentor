const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function getCorsHeaders(_req?: Request): Record<string, string> {
  return corsHeaders;
}

export function corsOptionsResponse(_req?: Request): Response {
  return new Response(null, { status: 200, headers: corsHeaders });
}
