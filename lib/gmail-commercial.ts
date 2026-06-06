import type { GmailThreadSummary, SalesProspect } from "./types";
import { normalizeSalesText } from "./sales-advice";

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
  };
};

export type GmailThread = {
  id?: string;
  messages?: GmailMessage[];
  snippet?: string;
};

function header(headers: GmailHeader[] = [], name: string) {
  return headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function emailFromHeader(value = "") {
  const match = value.match(/<([^>]+)>/);
  return normalizeSalesText(match?.[1] ?? value);
}

function dateFromMessage(message?: GmailMessage) {
  if (!message) return "";
  if (message.internalDate) return new Date(Number(message.internalDate)).toISOString();
  const date = header(message.payload?.headers, "Date");
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function daysSince(value?: string, now = new Date()) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export function matchProspectForThread(
  threadText: string,
  prospects: Array<Partial<SalesProspect>>
) {
  const text = normalizeSalesText(threadText);
  return prospects.find((prospect) => {
    const company = normalizeSalesText(prospect.company);
    const email = normalizeSalesText(prospect.email);
    const name = normalizeSalesText(prospect.name);
    return Boolean(
      (company && text.includes(company)) ||
        (email && text.includes(email)) ||
        (name && text.includes(name))
    );
  });
}

export function summarizeGmailThread(input: {
  thread: GmailThread;
  myEmail?: string;
  prospectName?: string;
  prospects?: Array<Partial<SalesProspect>>;
  now?: string;
}): GmailThreadSummary {
  const now = new Date(input.now ?? Date.now());
  const messages = [...(input.thread.messages ?? [])].sort(
    (a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0)
  );
  const last = messages.at(-1);
  const headers = last?.payload?.headers ?? [];
  const subject = header(headers, "Subject") || "Message Gmail";
  const from = header(headers, "From");
  const to = header(headers, "To");
  const lastMessageAt = dateFromMessage(last);
  const lastSender = emailFromHeader(from);
  const myEmail = normalizeSalesText(input.myEmail);
  const lastMessageFromMe = Boolean(myEmail && lastSender.includes(myEmail));
  const days = daysSince(lastMessageAt, now);
  const threadText = `${subject} ${from} ${to} ${last?.snippet ?? input.thread.snippet ?? ""}`;
  const matchedProspect = matchProspectForThread(threadText, input.prospects ?? []);
  const commercialStatus = lastMessageFromMe
    ? days >= 3
      ? "en_attente_reponse"
      : "recent"
    : "a_repondre";

  return {
    id: input.thread.id || last?.threadId || last?.id || crypto.randomUUID(),
    messageId: last?.id,
    subject,
    snippet: last?.snippet || input.thread.snippet || "Ouvrir Gmail pour lire le detail.",
    prospectName: matchedProspect?.company || input.prospectName,
    matchedProspectId: matchedProspect?.id,
    updatedAt: lastMessageAt,
    lastMessageAt,
    lastMessageFromMe,
    lastSender: from,
    commercialStatus,
    needsReply: commercialStatus === "a_repondre",
    daysSinceLastMessage: days,
    source: "gmail"
  };
}

export function demoGmailThreads(prospects: Array<Partial<SalesProspect>> = []): GmailThreadSummary[] {
  const prospect = prospects[0];
  return [
    {
      id: "demo-gmail-inbound",
      subject: `Question budget - ${prospect?.company || "Chateau de la Cour Senlisse"}`,
      snippet: "Bonjour, merci pour les elements. Pouvez-vous me confirmer le budget et la prochaine etape ?",
      prospectName: prospect?.company || "Chateau de la Cour Senlisse",
      matchedProspectId: prospect?.id,
      lastMessageAt: "2026-06-06T08:30:00+02:00",
      updatedAt: "2026-06-06T08:30:00+02:00",
      lastMessageFromMe: false,
      commercialStatus: "a_repondre",
      needsReply: true,
      daysSinceLastMessage: 0,
      source: "demo"
    },
    {
      id: "demo-gmail-waiting",
      subject: `Suite devis - ${prospect?.company || "Domaine Bellevue"}`,
      snippet: "Je vous ai envoye les deux scenarios, on peut se caler 20 minutes pour choisir le bon perimetre.",
      prospectName: prospect?.company || "Domaine Bellevue",
      matchedProspectId: prospect?.id,
      lastMessageAt: "2026-06-02T09:00:00+02:00",
      updatedAt: "2026-06-02T09:00:00+02:00",
      lastMessageFromMe: true,
      commercialStatus: "en_attente_reponse",
      needsReply: false,
      daysSinceLastMessage: 4,
      source: "demo"
    }
  ];
}

export function buildGmailQueryForProspect(prospect: Partial<SalesProspect>) {
  const parts = [prospect.email, prospect.company, prospect.name]
    .filter(Boolean)
    .map((value) => `"${String(value).replace(/"/g, "")}"`);
  return parts.length ? parts.join(" OR ") : "Prodecta newer_than:30d";
}
