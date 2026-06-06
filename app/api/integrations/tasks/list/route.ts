import { z } from "zod";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  taskListId: z.string().min(1).default("demo-tasks"),
  showCompleted: z.boolean().default(false)
});

function demoTasks() {
  return [
    {
      id: "demo-task-1",
      title: "Relancer Chateau de la Cour Senlisse",
      due: "2026-06-06T09:00:00+02:00",
      status: "needsAction",
      source: "demo"
    },
    {
      id: "demo-task-2",
      title: "Preparer RDV Domaine Bellevue",
      due: "2026-06-07T10:00:00+02:00",
      status: "needsAction",
      source: "demo"
    }
  ];
}

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
        message: "Google Tasks non connecte : taches demo chargees.",
        tasks: demoTasks()
      }
    });
  }

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(parsed.data.taskListId)}/tasks?showCompleted=${parsed.data.showCompleted}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 401 || response.status === 403) {
    return Response.json({
      demoMode: false,
      data: {
        state: "needs_reauth",
        message: "Google Tasks demande une reauth ou le scope tasks.",
        tasks: []
      }
    });
  }

  if (!response.ok) {
    return Response.json({ error: `Lecture Google Tasks impossible (${response.status})` }, { status: 502 });
  }

  const json = (await response.json()) as {
    items?: Array<{ id: string; title: string; due?: string; notes?: string; status?: string }>;
  };

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "Taches Google Tasks importees.",
      tasks: (json.items ?? []).map((task) => ({ ...task, source: "google" }))
    }
  });
}
