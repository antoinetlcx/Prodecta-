import { z } from "zod";
import { demoGmailThreads, summarizeGmailThread, type GmailThread } from "@/lib/gmail-commercial";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";
import type { SalesProspect } from "@/lib/types";

export const runtime = "nodejs";

const searchSchema = z.object({
  query: z.string().min(1),
  prospectName: z.string().min(0).optional(),
  prospects: z.array(z.custom<Partial<SalesProspect>>()).optional()
});

async function getProfileEmail(token: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return "";
  const json = (await response.json()) as { emailAddress?: string };
  return json.emailAddress ?? "";
}

async function fetchThread(token: string, threadId: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(threadId)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return undefined;
  return (await response.json()) as GmailThread;
}

export async function POST(request: Request) {
  const parsed = searchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);
  const prospects = parsed.data.prospects ?? [];

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Gmail non connecte : exemples locaux d'echanges charges.",
        threads: demoGmailThreads(prospects.length ? prospects : [{ company: parsed.data.prospectName || parsed.data.query }])
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
  const threadIds = [...new Set((json.messages ?? []).map((message) => message.threadId).filter(Boolean))].slice(0, 8);
  const [myEmail, threads] = await Promise.all([
    getProfileEmail(token),
    Promise.all(threadIds.map((threadId) => fetchThread(token, threadId)))
  ]);

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Messages Gmail analyses.",
      threads: threads
        .filter((thread): thread is GmailThread => Boolean(thread))
        .map((thread) =>
          summarizeGmailThread({
            thread,
            myEmail,
            prospectName: parsed.data.prospectName,
            prospects
          })
        )
    }
  });
}
