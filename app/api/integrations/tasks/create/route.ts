import { z } from "zod";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  taskListId: z.string().min(1).default("@default"),
  title: z.string().min(1),
  notes: z.string().min(0).optional(),
  due: z.string().min(1).optional(),
  prospectName: z.string().min(0).optional()
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        created: false,
        message: "Google Tasks non connecte : tache simulee, rien n'a ete cree.",
        task: { id: crypto.randomUUID(), ...parsed.data, status: "needsAction", source: "demo" }
      }
    });
  }

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(parsed.data.taskListId)}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: parsed.data.title,
        notes: parsed.data.notes,
        due: parsed.data.due
      })
    }
  );

  if (!response.ok) {
    return Response.json({ error: `Creation Google Tasks impossible (${response.status})` }, { status: 502 });
  }

  const task = (await response.json()) as { id?: string; title?: string };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      created: true,
      message: "Tache Google Tasks creee.",
      task
    }
  });
}
