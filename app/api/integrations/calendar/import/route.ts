import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

function demoMeetings() {
  return [
    {
      id: "demo-calendar-1",
      title: "RDV Prodecta - Chateau de la Cour Senlisse",
      start: "2026-06-08T10:00:00+02:00",
      end: "2026-06-08T11:00:00+02:00",
      prospectName: "Chateau de la Cour Senlisse",
      source: "demo"
    },
    {
      id: "demo-calendar-2",
      title: "Relance devis - Domaine Bellevue",
      start: "2026-06-09T15:30:00+02:00",
      end: "2026-06-09T16:00:00+02:00",
      prospectName: "Domaine Bellevue",
      source: "demo"
    }
  ];
}

export async function POST() {
  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Google Calendar non connecte : exemple local charge.",
        meetings: demoMeetings()
      }
    });
  }

  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=10&timeMin=${encodeURIComponent(now)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 401 || response.status === 403) {
    return Response.json({
      demoMode: false,
      data: {
        state: "needs_reauth",
        message: "Google Calendar demande une reauth ou plus de permissions.",
        meetings: []
      }
    });
  }

  if (!response.ok) {
    return Response.json({ error: `Import Calendar impossible (${response.status})` }, { status: 502 });
  }

  const json = (await response.json()) as {
    items?: Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }>;
  };

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "RDV importes depuis Google Calendar.",
      meetings: (json.items ?? []).map((event) => ({
        id: event.id,
        title: event.summary ?? "Sans titre",
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        source: "google"
      }))
    }
  });
}
