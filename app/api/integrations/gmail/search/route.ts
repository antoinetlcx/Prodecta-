import { z } from "zod";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const searchSchema = z.object({
  query: z.string().min(1),
  prospectName: z.string().min(0).optional()
});

export async function POST(request: Request) {
  const parsed = searchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Gmail non connecte : exemple local d'echange charge.",
        threads: [
          {
            id: "demo-thread",
            subject: `Echanges avec ${parsed.data.prospectName || parsed.data.query}`,
            snippet: "Merci pour la proposition, nous devons regarder le budget et en parler en interne.",
            source: "demo"
          }
        ]
      }
    });
  }

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(parsed.data.query)}&maxResults=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 401 || response.status === 403) {
    return Response.json({
      demoMode: false,
      data: {
        state: "needs_reauth",
        message: "Gmail demande une reauth ou plus de permissions.",
        threads: []
      }
    });
  }

  if (!response.ok) {
    return Response.json({ error: `Recherche Gmail impossible (${response.status})` }, { status: 502 });
  }

  const json = (await response.json()) as { messages?: Array<{ id: string; threadId: string }> };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Messages Gmail trouves.",
      threads: (json.messages ?? []).map((message) => ({
        id: message.threadId,
        messageId: message.id,
        subject: "Message Gmail",
        snippet: "Ouvrir Gmail pour lire le detail.",
        source: "gmail"
      }))
    }
  });
}
