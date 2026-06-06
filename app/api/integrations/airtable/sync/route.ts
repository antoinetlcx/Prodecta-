import { z } from "zod";
import {
  getAirtableBaseId,
  getAirtableBaseName,
  getAirtableToken,
  patchIntegrationStore,
  readIntegrationStore
} from "@/lib/server-integrations";

export const runtime = "nodejs";

const syncSchema = z.object({
  kind: z.enum(["prospect", "meeting", "report", "followup", "task"]),
  payload: z.record(z.string(), z.unknown()).default({})
});

const tableByKind = {
  prospect: "prospectsTableId",
  meeting: "meetingsTableId",
  report: "reportsTableId",
  followup: "followupsTableId",
  task: "tasksTableId"
} as const;

export async function POST(request: Request) {
  const parsed = syncSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const token = getAirtableToken();
  const baseId = getAirtableBaseId();
  const baseName = getAirtableBaseName();
  const store = await readIntegrationStore();
  const tableId = store.airtable?.mapping?.[tableByKind[parsed.data.kind]];

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        synced: false,
        state: "needs_reauth",
        message: "Airtable non connecte : export simule localement.",
        baseId,
        baseName,
        kind: parsed.data.kind
      }
    });
  }

  if (!tableId) {
    return Response.json({
      demoMode: false,
      data: {
        synced: false,
        state: "needs_mapping",
        message: "Base accessible, mais mapping des tables a finaliser apres reauth/schema.",
        baseId,
        baseName,
        kind: parsed.data.kind
      }
    });
  }

  const fields = Object.entries(parsed.data.payload).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = typeof value === "string" ? value : JSON.stringify(value);
    return acc;
  }, {});

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    return Response.json(
      { error: `Export Airtable impossible (${response.status})` },
      { status: 502 }
    );
  }

  const record = (await response.json()) as { id?: string };
  await patchIntegrationStore((current) => ({
    ...current,
    airtable: {
      baseId,
      baseName,
      mapping: current.airtable?.mapping,
      lastSyncAt: new Date().toISOString()
    }
  }));

  return Response.json({
    demoMode: false,
    data: {
      synced: true,
      state: "connected",
      recordId: record.id,
      message: "Export Airtable effectue."
    }
  });
}
