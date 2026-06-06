import { z } from "zod";
import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const eventSchema = z.object({
  prospectName: z.string().min(1),
  title: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  description: z.string().optional(),
  attendees: z.array(z.string().email()).optional()
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})));
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
        message: "Google Calendar non connecte : RDV simule, aucun evenement cree.",
        event: { id: "demo-created-event", ...parsed.data }
      }
    });
  }

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: parsed.data.title,
      description: parsed.data.description,
      start: { dateTime: parsed.data.start },
      end: { dateTime: parsed.data.end },
      attendees: parsed.data.attendees?.map((email) => ({ email }))
    })
  });

  if (!response.ok) {
    return Response.json({ error: `Creation Calendar impossible (${response.status})` }, { status: 502 });
  }

  const event = (await response.json()) as { id?: string; htmlLink?: string };
  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      created: true,
      message: "RDV cree dans Google Calendar.",
      event
    }
  });
}
