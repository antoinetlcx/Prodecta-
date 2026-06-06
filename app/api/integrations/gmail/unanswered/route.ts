import { z } from "zod";
import {
  buildGmailQueryForProspect,
  demoGmailThreads,
  summarizeGmailThread,
  type GmailThread
} from "@/lib/gmail-commercial";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";
import type { SalesProspect } from "@/lib/types";

export const runtime = "nodejs";

const payloadSchema = z.object({
  prospects: z.array(z.custom<Partial<SalesProspect>>()).default([]),
  maxProspects: z.number().int().min(1).max(25).default(12)
});

async function getProfileEmail(token: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return "";
  const json = (await response.json()) as { emailAddress?: string };
  return json.emailAddress ?? "";
}

async function searchThreadIds(token: string, query: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { messages?: Array<{ threadId: string }> };
  return [...new Set((json.messages ?? []).map((message) => message.threadId).filter(Boolean))];
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
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const prospects = parsed.data.prospects.slice(0, parsed.data.maxProspects);
  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    const demoThreads = demoGmailThreads(prospects).filter(
      (thread) => thread.needsReply || thread.commercialStatus === "en_attente_reponse"
    );
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Gmail non connecte : mails sans reponse demo charges.",
        receivedToHandle: demoThreads.filter((thread) => thread.needsReply),
        sentWithoutReply: demoThreads.filter((thread) => thread.commercialStatus === "en_attente_reponse"),
        threads: demoThreads
      }
    });
  }

  const myEmail = await getProfileEmail(token);
  const threadIdSet = new Set<string>();
  for (const prospect of prospects) {
    const query = `${buildGmailQueryForProspect(prospect)} newer_than:60d`;
    const ids = await searchThreadIds(token, query);
    ids.forEach((id) => threadIdSet.add(id));
  }

  const threads = await Promise.all([...threadIdSet].slice(0, 40).map((threadId) => fetchThread(token, threadId)));
  const summaries = threads
    .filter((thread): thread is GmailThread => Boolean(thread))
    .map((thread) => summarizeGmailThread({ thread, myEmail, prospects }))
    .filter((thread) => thread.needsReply || thread.commercialStatus === "en_attente_reponse");

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Threads Gmail commerciaux analyses.",
      receivedToHandle: summaries.filter((thread) => thread.needsReply),
      sentWithoutReply: summaries.filter((thread) => thread.commercialStatus === "en_attente_reponse"),
      threads: summaries
    }
  });
}
