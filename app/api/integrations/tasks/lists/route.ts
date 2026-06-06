import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

export async function POST() {
  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Google Tasks non connecte : liste demo chargee.",
        lists: [{ id: "demo-tasks", title: "Prodecta - Actions commerciales" }]
      }
    });
  }

  const response = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401 || response.status === 403) {
    return Response.json({
      demoMode: false,
      data: {
        state: "needs_reauth",
        message: "Google Tasks demande une reauth ou le scope tasks.",
        lists: []
      }
    });
  }

  if (!response.ok) {
    return Response.json({ error: `Google Tasks indisponible (${response.status})` }, { status: 502 });
  }

  const json = (await response.json()) as { items?: Array<{ id: string; title: string }> };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Listes Google Tasks importees.",
      lists: json.items ?? []
    }
  });
}
