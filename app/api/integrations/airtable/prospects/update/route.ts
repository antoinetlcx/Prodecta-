import { z } from "zod";
import {
  buildAirtableUpdateFields,
  DEFAULT_PIPELINE_TABLE_NAME,
  findPipelineTable,
  type AirtableTable
} from "@/lib/airtable-crm";
import { getAirtableBaseId, getAirtableToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  recordId: z.string().min(1),
  nextAction: z.string().min(0).optional(),
  nextActionDate: z.string().min(0).optional()
});

async function discoverTable(token: string, baseId: string, mappedTableId?: string) {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return undefined;
  const json = (await response.json()) as { tables?: AirtableTable[] };
  const tables = json.tables ?? [];
  return tables.find((table) => table.id === mappedTableId) ?? findPipelineTable(tables);
}

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const token = getAirtableToken();
  const baseId = getAirtableBaseId();
  const store = await readIntegrationStore();

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "needs_reauth",
        updated: false,
        message: "Airtable non connecte : mise a jour simulee.",
        recordId: parsed.data.recordId
      }
    });
  }

  const table = await discoverTable(token, baseId, store.airtable?.mapping?.prospectsTableId);
  const { fields, missing } = buildAirtableUpdateFields(table, parsed.data);

  if (!table || !Object.keys(fields).length || missing.length) {
    return Response.json(
      {
        demoMode: false,
        data: {
          state: "needs_mapping",
          updated: false,
          message: `Mapping Airtable incomplet pour ${missing.join(", ") || "les champs de prochaine action"}.`,
          missing,
          tableName: table?.name || DEFAULT_PIPELINE_TABLE_NAME
        }
      },
      { status: 409 }
    );
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table.id)}/${encodeURIComponent(parsed.data.recordId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    }
  );

  if (!response.ok) {
    return Response.json({ error: `Mise a jour Airtable impossible (${response.status})` }, { status: 502 });
  }

  const record = (await response.json()) as { id?: string };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      updated: true,
      message: "Prochaine action mise a jour dans Airtable.",
      recordId: record.id || parsed.data.recordId
    }
  });
}
