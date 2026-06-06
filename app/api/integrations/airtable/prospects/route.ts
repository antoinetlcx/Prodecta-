import { z } from "zod";
import { getAirtableBaseId, getAirtableToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  limit: z.number().int().min(1).max(100).default(25)
});

const FIELD_ALIASES = {
  name: ["nom", "name", "prospect", "contact"],
  company: ["entreprise", "company", "societe", "compte"],
  email: ["email", "mail"],
  phone: ["telephone", "phone", "tel"],
  status: ["statut pipeline", "statut", "status", "pipeline"],
  sector: ["secteur", "sector"],
  need: ["besoin", "need"],
  amount: ["montant potentiel", "montant", "amount", "valeur"],
  lastContact: ["dernier contact", "last contact", "lastcontact"],
  nextAction: ["prochaine action", "next action", "next step", "nextstep"],
  followupDate: ["date de relance", "relance", "followup"],
  notes: ["notes", "note"],
  linkedInUrl: ["linkedin", "lien linkedin"],
  website: ["site", "site web", "website"]
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pick(fields: Record<string, unknown>, aliases: string[]) {
  const entry = Object.entries(fields).find(([key]) => aliases.includes(normalize(key)));
  const value = entry?.[1];
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null) return "";
  return String(value);
}

function demoProspects() {
  return [
    {
      id: "demo-prospect-1",
      name: "Sophie Martin",
      company: "Chateau de la Cour Senlisse",
      email: "sophie@example.com",
      sector: "chateau_domaine",
      pipelineStatus: "chaud",
      need: "Mieux projeter les visiteurs avant visite",
      potentialAmount: 24000,
      lastContactAt: "2026-06-02T16:00:00+02:00",
      nextAction: "",
      followupDate: "2026-06-06T09:00:00+02:00",
      notes: "Interessée par deux scenarios."
    },
    {
      id: "demo-prospect-2",
      name: "Marc Petit",
      company: "Domaine Bellevue",
      email: "marc@example.com",
      sector: "hotel",
      pipelineStatus: "proposition",
      need: "Augmenter les reservations directes",
      potentialAmount: 18000,
      lastContactAt: "2026-06-04T14:00:00+02:00",
      nextAction: "Choisir le perimetre",
      followupDate: "2026-06-07T10:00:00+02:00"
    }
  ];
}

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const token = getAirtableToken();
  const store = await readIntegrationStore();
  const baseId = getAirtableBaseId();
  const tableId = store.airtable?.mapping?.prospectsTableId;

  if (!token || !tableId) {
    return Response.json({
      demoMode: true,
      data: {
        state: token ? "needs_mapping" : "needs_reauth",
        message: token
          ? "Mapping prospects Airtable a finaliser : donnees demo affichees."
          : "Airtable non connecte : prospects demo charges.",
        prospects: demoProspects()
      }
    });
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=${parsed.data.limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    return Response.json({ error: `Lecture prospects Airtable impossible (${response.status})` }, { status: 502 });
  }

  const json = (await response.json()) as {
    records?: Array<{ id: string; fields: Record<string, unknown> }>;
  };
  const prospects = (json.records ?? []).map((record) => ({
    id: record.id,
    name: pick(record.fields, FIELD_ALIASES.name) || pick(record.fields, FIELD_ALIASES.company),
    company: pick(record.fields, FIELD_ALIASES.company),
    email: pick(record.fields, FIELD_ALIASES.email),
    phone: pick(record.fields, FIELD_ALIASES.phone),
    sector: pick(record.fields, FIELD_ALIASES.sector) || "autre",
    pipelineStatus: pick(record.fields, FIELD_ALIASES.status) || "nouveau",
    need: pick(record.fields, FIELD_ALIASES.need),
    potentialAmount: Number(pick(record.fields, FIELD_ALIASES.amount)) || undefined,
    lastContactAt: pick(record.fields, FIELD_ALIASES.lastContact),
    nextAction: pick(record.fields, FIELD_ALIASES.nextAction),
    followupDate: pick(record.fields, FIELD_ALIASES.followupDate),
    notes: pick(record.fields, FIELD_ALIASES.notes),
    linkedInUrl: pick(record.fields, FIELD_ALIASES.linkedInUrl),
    website: pick(record.fields, FIELD_ALIASES.website)
  }));

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Prospects Airtable importes.",
      prospects
    }
  });
}
