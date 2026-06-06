import { buildIntegrationStatuses, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

export async function GET() {
  const store = await readIntegrationStore();
  return Response.json({ data: { statuses: buildIntegrationStatuses(store) } });
}
