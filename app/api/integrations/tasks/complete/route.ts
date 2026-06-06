import { z } from "zod";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const payloadSchema = z.object({
  taskListId: z.string().min(1).default("@default"),
  taskId: z.string().min(1)
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
        completed: false,
        message: "Google Tasks non connecte : cloture simulee.",
        taskId: parsed.data.taskId
      }
    });
  }

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(parsed.data.taskListId)}/tasks/${encodeURIComponent(parsed.data.taskId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "completed", completed: new Date().toISOString() })
    }
  );

  if (!response.ok) {
    return Response.json({ error: `Cloture Google Tasks impossible (${response.status})` }, { status: 502 });
  }

  const task = (await response.json()) as { id?: string; status?: string };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      completed: true,
      message: "Tache Google Tasks terminee.",
      task
    }
  });
}
