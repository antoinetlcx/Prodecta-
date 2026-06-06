export const runtime = "nodejs";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose"
];

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const requestUrl = new URL(request.url);
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${requestUrl.origin}/api/integrations/google/oauth/callback`;

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error:
          "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis pour lancer OAuth local."
      },
      { status: 400 }
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  authUrl.searchParams.set("state", requestUrl.searchParams.get("returnTo") ?? "/");

  return Response.redirect(authUrl.toString(), 302);
}
