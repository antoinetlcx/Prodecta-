import { getAirtableBaseId, getAirtableBaseName, getAirtableToken } from "@/lib/server-integrations";

export const runtime = "nodejs";

export async function POST() {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();
  const baseName = getAirtableBaseName();

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        baseId,
        baseName,
        state: "needs_reauth",
        message: "Reauth Airtable requise avant lecture du schema.",
        tables: []
      }
    });
  }

  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401 || response.status === 403) {
    return Response.json({
      demoMode: false,
      data: {
        baseId,
        baseName,
        state: "needs_reauth",
        message: "Token Airtable refuse ou permissions insuffisantes.",
        tables: []
      }
    });
  }

  if (!response.ok) {
    return Response.json(
      { error: `Airtable indisponible (${response.status})` },
      { status: 502 }
    );
  }

  const json = (await response.json()) as {
    tables?: Array<{ id: string; name: string; fields?: Array<{ id: string; name: string; type: string }> }>;
  };

  return Response.json({
    demoMode: false,
    data: {
      baseId,
      baseName,
      state: "connected",
      message: "Base Airtable accessible.",
      tables: json.tables ?? []
    }
  });
}
