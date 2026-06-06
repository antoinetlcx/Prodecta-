import type { Sector } from "./schemas";
import type { SalesProspect } from "./types";
import { enrichProspectPriority, normalizeSalesText } from "./sales-advice";

export const DEFAULT_PIPELINE_TABLE_NAME = "Pipeline Commercial";

export type AirtableField = {
  id: string;
  name: string;
  type?: string;
};

export type AirtableTable = {
  id: string;
  name: string;
  fields?: AirtableField[];
};

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

export const AIRTABLE_FIELD_ALIASES = {
  name: ["nom", "name", "prospect", "contact", "prenom", "personne"],
  company: ["societe", "entreprise", "nom", "company", "compte", "account"],
  email: ["email", "mail", "e-mail"],
  phone: ["telephone", "phone", "tel", "mobile"],
  status: ["statut pipeline", "statut", "status", "pipeline"],
  sector: ["secteur", "sector"],
  need: ["besoin", "need", "enjeu", "objectif"],
  amount: ["montant potentiel", "montant", "amount", "valeur", "deal value"],
  lastContact: ["dernier contact", "last contact", "lastcontact", "date dernier contact"],
  nextAction: ["prochaine action", "next action", "next step", "nextstep"],
  nextActionDate: [
    "date prochaine action",
    "date prochaine",
    "date prochaine...",
    "date de prochaine action",
    "date de relance",
    "relance",
    "followup"
  ],
  notes: ["notes enrichies", "notes", "note", "commentaires", "commentaire", "contexte"],
  linkedInUrl: ["linkedin", "lien linkedin"],
  website: ["site", "site web", "website", "url"]
} as const;

export type AirtableAliasKey = keyof typeof AIRTABLE_FIELD_ALIASES;

function normalizeKey(value: string) {
  return normalizeSalesText(value).replace(/\.+$/g, "");
}

function stringifyField(value: unknown): string {
  if (Array.isArray(value)) return value.map(stringifyField).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    if ("name" in value && typeof value.name === "string") return value.name;
    return JSON.stringify(value);
  }
  if (value === undefined || value === null) return "";
  return String(value);
}

export function findFieldName(fields: Record<string, unknown> | AirtableField[] | undefined, aliases: readonly string[]) {
  if (!fields) return "";
  const normalizedAliases = aliases.map(normalizeKey);
  const names = Array.isArray(fields) ? fields.map((field) => field.name) : Object.keys(fields);
  const exact = names.find((name) => normalizedAliases.includes(normalizeKey(name)));
  if (exact) return exact;
  return (
    names.find((name) => {
      const normalized = normalizeKey(name);
      return normalizedAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized));
    }) ?? ""
  );
}

export function pickAirtableField(fields: Record<string, unknown>, aliases: readonly string[]) {
  const name = findFieldName(fields, aliases);
  return name ? stringifyField(fields[name]) : "";
}

function parseAmount(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function normalizeSector(value: string): Sector {
  const text = normalizeSalesText(value);
  if (/sport|fitness|gym/.test(text)) return "salle_sport";
  if (/hotel|hôtel/.test(text)) return "hotel";
  if (/gite|airbnb|location/.test(text)) return "gite";
  if (/chateau|domaine|mariage/.test(text)) return "chateau_domaine";
  if (/restaurant|resto/.test(text)) return "restaurant";
  if (/event|evenement|salle/.test(text)) return "salle_evenementielle";
  return "autre";
}

export function findPipelineTable(tables: AirtableTable[] = []) {
  const target = normalizeKey(DEFAULT_PIPELINE_TABLE_NAME);
  return (
    tables.find((table) => normalizeKey(table.name) === target) ??
    tables.find((table) => normalizeKey(table.name).includes("pipeline commercial")) ??
    tables.find((table) => normalizeKey(table.name).includes("pipeline")) ??
    tables[0]
  );
}

export function mapAirtableRecordToProspect(
  record: AirtableRecord,
  options: { baseId: string; tableIdOrName: string; now?: string } = { baseId: "", tableIdOrName: "" }
): SalesProspect {
  const fields = record.fields;
  const company = pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.company);
  const name = pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.name) || company || "Prospect";
  const pipelineStatusRaw = pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.status) || "nouveau";
  const nextActionDate = pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.nextActionDate);
  const notes = pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.notes);
  const prospect: SalesProspect = {
    id: record.id,
    airtableRecordId: record.id,
    name,
    company: company || name,
    email: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.email),
    phone: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.phone) || undefined,
    sector: normalizeSector(pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.sector)),
    pipelineStatus: pipelineStatusRaw,
    pipelineStatusRaw,
    source: "Airtable",
    need: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.need) || undefined,
    potentialAmount: parseAmount(pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.amount)),
    lastContactAt: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.lastContact) || undefined,
    nextAction: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.nextAction) || "",
    nextActionDate: nextActionDate || undefined,
    followupDate: nextActionDate || undefined,
    notes,
    enrichedNotes: notes,
    linkedInUrl: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.linkedInUrl) || undefined,
    website: pickAirtableField(fields, AIRTABLE_FIELD_ALIASES.website) || undefined,
    airtableUrl:
      options.baseId && options.tableIdOrName
        ? `https://airtable.com/${options.baseId}/${options.tableIdOrName}/${record.id}`
        : undefined
  };

  return enrichProspectPriority(prospect, options.now);
}

export function demoProspects(now = "2026-06-06T09:00:00+02:00"): SalesProspect[] {
  return [
    mapAirtableRecordToProspect(
      {
        id: "demo-prospect-1",
        fields: {
          "Société": "Chateau de la Cour Senlisse",
          "Statut pipeline": "Purchase",
          "Notes enrichies": "Tres interessee par deux scenarios. Devis a cadrer avec associe.",
          "Prochaine action": "",
          "Date prochaine action": "2026-06-06T09:00:00+02:00",
          "Dernier contact": "2026-05-27T16:00:00+02:00",
          Email: "sophie@example.com",
          Secteur: "chateau"
        }
      },
      { baseId: "demo", tableIdOrName: DEFAULT_PIPELINE_TABLE_NAME, now }
    ),
    mapAirtableRecordToProspect(
      {
        id: "demo-prospect-2",
        fields: {
          "Société": "Domaine Bellevue",
          "Statut pipeline": "Purchase",
          "Notes enrichies": "Ok pour avancer, attend une proposition claire.",
          "Prochaine action": "Choisir le perimetre",
          "Date prochaine action": "2026-06-07T10:00:00+02:00",
          "Dernier contact": "2026-06-04T14:00:00+02:00",
          Email: "marc@example.com",
          Secteur: "hotel"
        }
      },
      { baseId: "demo", tableIdOrName: DEFAULT_PIPELINE_TABLE_NAME, now }
    )
  ];
}

export function buildAirtableUpdateFields(
  table: AirtableTable | undefined,
  payload: { nextAction?: string; nextActionDate?: string }
) {
  const nextActionField = findFieldName(table?.fields, AIRTABLE_FIELD_ALIASES.nextAction);
  const nextActionDateField = findFieldName(table?.fields, AIRTABLE_FIELD_ALIASES.nextActionDate);
  const fields: Record<string, string> = {};
  if (nextActionField && payload.nextAction !== undefined) fields[nextActionField] = payload.nextAction;
  if (nextActionDateField && payload.nextActionDate !== undefined) fields[nextActionDateField] = payload.nextActionDate;
  return {
    fields,
    missing: [
      !nextActionField && payload.nextAction !== undefined ? "Prochaine action" : "",
      !nextActionDateField && payload.nextActionDate !== undefined ? "Date prochaine action" : ""
    ].filter(Boolean)
  };
}
