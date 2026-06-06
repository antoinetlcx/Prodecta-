import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AirtableMapping,
  IntegrationStatus,
  IntegrationProvider
} from "./types";

const LOCAL_DIR = ".prodecta-local";
const STORE_FILE = "integrations.json";
const DEFAULT_AIRTABLE_BASE_ID = "appYccQqBN2qgQ1uA";
const DEFAULT_AIRTABLE_BASE_NAME = "Prodecta - Pipeline commercial";

type StoredGoogleTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string[];
  email?: string;
};

export type IntegrationStore = {
  airtable?: {
    baseId: string;
    baseName: string;
    mapping?: AirtableMapping;
    lastSyncAt?: string;
  };
  google?: StoredGoogleTokens;
  gmail?: {
    lastDraftAt?: string;
  };
  updatedAt?: string;
};

function storePath() {
  if (process.env.PRODECTA_INTEGRATION_STORE_PATH) {
    return process.env.PRODECTA_INTEGRATION_STORE_PATH;
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), LOCAL_DIR, STORE_FILE);
}

export async function readIntegrationStore(): Promise<IntegrationStore> {
  try {
    const raw = await readFile(storePath(), "utf8");
    return JSON.parse(raw) as IntegrationStore;
  } catch {
    return {};
  }
}

export async function writeIntegrationStore(nextStore: IntegrationStore) {
  const filePath = storePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({ ...nextStore, updatedAt: new Date().toISOString() }, null, 2),
    "utf8"
  );
}

export async function patchIntegrationStore(
  patcher: (store: IntegrationStore) => IntegrationStore | Promise<IntegrationStore>
) {
  const current = await readIntegrationStore();
  const next = await patcher(current);
  await writeIntegrationStore(next);
  return next;
}

export function getAirtableBaseId() {
  return process.env.AIRTABLE_BASE_ID || DEFAULT_AIRTABLE_BASE_ID;
}

export function getAirtableBaseName() {
  return process.env.AIRTABLE_BASE_NAME || DEFAULT_AIRTABLE_BASE_NAME;
}

export function getAirtableToken() {
  return process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || "";
}

export function getGoogleAccessToken(store: IntegrationStore) {
  return store.google?.accessToken || process.env.GOOGLE_ACCESS_TOKEN || "";
}

export function getGoogleRefreshToken(store: IntegrationStore) {
  return store.google?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || "";
}

export function tokenExpiresSoon(store: IntegrationStore) {
  if (!store.google?.expiresAt) return false;
  return new Date(store.google.expiresAt).getTime() < Date.now() + 60_000;
}

function status(
  provider: IntegrationProvider,
  label: string,
  state: IntegrationStatus["state"],
  detail: string,
  configured: boolean,
  lastSyncAt?: string
): IntegrationStatus {
  return { provider, label, state, detail, configured, lastSyncAt };
}

export function buildIntegrationStatuses(store: IntegrationStore): IntegrationStatus[] {
  const airtableToken = getAirtableToken();
  const hasGoogle = Boolean(getGoogleAccessToken(store) || getGoogleRefreshToken(store));
  const googleExpired = hasGoogle && tokenExpiresSoon(store);
  const googleState = hasGoogle ? (googleExpired ? "needs_reauth" : "connected") : "not_configured";

  return [
    status(
      "airtable",
      "Airtable Prodecta",
      airtableToken ? "connected" : "needs_reauth",
      airtableToken
        ? `Base cible : ${getAirtableBaseName()}`
        : "Reauth Airtable requise pour lire et mapper la base pipeline.",
      Boolean(airtableToken),
      store.airtable?.lastSyncAt
    ),
    status(
      "googleCalendar",
      "Google Calendar",
      googleState,
      hasGoogle
        ? "Import RDV et creation de relance disponibles."
        : "OAuth local a configurer pour importer et creer des RDV.",
      hasGoogle,
      store.updatedAt
    ),
    status(
      "googleTasks",
      "Google Tasks",
      googleState,
      hasGoogle
        ? "Lecture, creation et cloture de taches commerciales disponibles."
        : "OAuth Google requis pour synchroniser les taches.",
      hasGoogle,
      store.updatedAt
    ),
    status(
      "gmail",
      "Gmail",
      googleState,
      hasGoogle
        ? "Recherche d'echanges et creation de brouillons activees."
        : "OAuth Gmail requis. Aucun email n'est envoye automatiquement.",
      hasGoogle,
      store.gmail?.lastDraftAt
    ),
    status(
      "openai",
      "OpenAI",
      process.env.OPENAI_API_KEY ? "connected" : "not_configured",
      process.env.OPENAI_API_KEY
        ? "Generation avancee disponible en option."
        : "Optionnel : conseils locaux, templates et synchronisations restent disponibles.",
      Boolean(process.env.OPENAI_API_KEY)
    )
  ];
}

export async function integrationJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}
