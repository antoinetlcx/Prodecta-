import { z } from "zod";
import {
  DEFAULT_PIPELINE_TABLE_NAME,
  demoProspects,
  findPipelineTable,
  mapAirtableRecordToProspect,
  type AirtableRecord,
  type AirtableTable
} from "@/lib/airtable-crm";
import {
  getAirtableBaseId,
  getAirtableToken,
  patchIntegrationStore,
  readIntegrationStore
} from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  limit: z.number().int().min(1).max(500).default(200)
});

async function discoverPipelineTable(token: string, baseId: string) {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return undefined;
  const json = (await response.json()) as { tables?: AirtableTable[] };
  return findPipelineTable(json.tables ?? []);
}

async function readAirtableRecords(token: string, baseId: string, tableIdOrName: string, limit: number) {
  const records: AirtableRecord[] = [];
  let offset = "";

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableIdOrName)}`);
    url.searchParams.set("pageSize", String(Math.min(100, limit - records.length)));
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      return { ok: false as const, status: response.status, records: [] as AirtableRecord[] };
    }

    const json = (await response.json()) as { records?: AirtableRecord[]; offset?: string };
    records.push(...(json.records ?? []));
    offset = json.offset ?? "";
  } while (offset && records.length < limit);

  return { ok: true as const, records };
}

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const token = getAirtableToken();
  const store = await readIntegrationStore();
  const baseId = getAirtableBaseId();

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "needs_reauth",
        message: "Airtable non connecte : prospects demo Purchase charges.",
        tableName: DEFAULT_PIPELINE_TABLE_NAME,
        prospects: demoProspects()
      }
    });
  }

  const discoveredTable = await discoverPipelineTable(token, baseId);
  const tableIdOrName =
    store.airtable?.mapping?.prospectsTableId || discoveredTable?.id || DEFAULT_PIPELINE_TABLE_NAME;

  const result = await readAirtableRecords(token, baseId, tableIdOrName, parsed.data.limit);
  if (!result.ok) {
    return Response.json(
      { error: `Lecture prospects Airtable impossible (${result.status})` },
      { status: 502 }
    );
  }

  if (discoveredTable) {
    await patchIntegrationStore((current) => ({
      ...current,
      airtable: {
        baseId,
        baseName: current.airtable?.baseName || "Prodecta - Pipeline commercial",
        mapping: {
          ...current.airtable?.mapping,
          baseId,
          baseName: current.airtable?.baseName || "Prodecta - Pipeline commercial",
          prospectsTableId: discoveredTable.id
        },
        lastSyncAt: new Date().toISOString()
      }
    }));
  }

  const prospects = result.records.map((record) =>
    mapAirtableRecordToProspect(record, {
      baseId,
      tableIdOrName,
      now: new Date().toISOString()
    })
  );

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Prospects Airtable importes depuis Pipeline Commercial.",
      tableName: discoveredTable?.name || DEFAULT_PIPELINE_TABLE_NAME,
      prospects
    }
  });
}
