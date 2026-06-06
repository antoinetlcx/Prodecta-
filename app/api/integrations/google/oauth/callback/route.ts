import { patchIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${url.origin}/api/integrations/google/oauth/callback`;

  if (error) {
    return new Response(`Connexion Google refusee : ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("Code OAuth manquant.", { status: 400 });
  }

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis pour finaliser OAuth." },
      { status: 400 }
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokenJson = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || tokenJson.error) {
    return Response.json(
      { error: tokenJson.error_description ?? tokenJson.error ?? "Echange OAuth impossible." },
      { status: 400 }
    );
  }

  await patchIntegrationStore((store) => ({
    ...store,
    google: {
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token ?? store.google?.refreshToken,
      expiresAt: tokenJson.expires_in
        ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
        : store.google?.expiresAt,
      scope: tokenJson.scope?.split(" ") ?? store.google?.scope ?? []
    }
  }));

  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;padding:32px"><h1>Google connecte</h1><p>Vous pouvez revenir dans Prodecta Sales Pilot.</p><script>setTimeout(()=>location.href='/',1200)</script></body></html>`,
    { headers: { "Content-Type": "text/html;charset=utf-8" } }
  );
}
