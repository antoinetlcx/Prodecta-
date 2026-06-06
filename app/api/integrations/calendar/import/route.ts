import { getGoogleAccessToken, readIntegrationStore } from "@/lib/server-integrations";
import { normalizeSalesText } from "@/lib/sales-advice";
import type { SalesProspect } from "@/lib/types";

export const runtime = "nodejs";

function matchProspect(
  eventText: string,
  prospects: Array<Partial<SalesProspect>>
) {
  const text = normalizeSalesText(eventText);
  return prospects.find((prospect) => {
    const company = normalizeSalesText(prospect.company);
    const name = normalizeSalesText(prospect.name);
    const email = normalizeSalesText(prospect.email);
    return Boolean(
      (company && text.includes(company)) ||
        (name && text.includes(name)) ||
        (email && text.includes(email))
    );
  });
}

function demoMeetings(prospects: Array<Partial<SalesProspect>> = []) {
  const first = prospects[0];
  return [
    {
      id: "demo-calendar-1",
      title: `RDV Prodecta - ${first?.company || "Chateau de la Cour Senlisse"}`,
      start: "2026-06-08T10:00:00+02:00",
      end: "2026-06-08T11:00:00+02:00",
      description: "Qualifier le besoin, le budget et la prochaine etape.",
      attendees: [first?.email || "sophie@example.com"].filter(Boolean),
      prospectName: first?.company || "Chateau de la Cour Senlisse",
      matchedProspectId: first?.id,
      preparationStatus: "a_faire",
      source: "demo"
    },
    {
      id: "demo-calendar-2",
      title: "Relance devis - Domaine Bellevue",
      start: "2026-06-09T15:30:00+02:00",
      end: "2026-06-09T16:00:00+02:00",
      description: "Valider le perimetre et proposer une date de decision.",
      attendees: ["marc@example.com"],
      prospectName: "Domaine Bellevue",
      preparationStatus: "a_faire",
      source: "demo"
    }
  ];
}

export async function POST(request?: Request) {
  const body = request ? await request.json().catch(() => ({})) : {};
  const prospects = Array.isArray(body.prospects) ? (body.prospects as Array<Partial<SalesProspect>>) : [];
  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        message: "Google Calendar non connecte : exemple local charge.",
        meetings: demoMeetings(prospects)
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
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      attendees?: Array<{ email?: string; displayName?: string }>;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      message: "RDV importes depuis Google Calendar.",
      meetings: (json.items ?? []).map((event) => {
        const attendees = (event.attendees ?? [])
          .map((attendee) => attendee.email ?? attendee.displayName ?? "")
          .filter(Boolean);
        const matched = matchProspect(
          `${event.summary ?? ""} ${event.description ?? ""} ${attendees.join(" ")}`,
          prospects
        );
        return {
          id: event.id,
          title: event.summary ?? "Sans titre",
          start: event.start?.dateTime ?? event.start?.date ?? "",
          end: event.end?.dateTime ?? event.end?.date ?? "",
          description: event.description ?? "",
          attendees,
          prospectName: matched?.company,
          matchedProspectId: matched?.id,
          preparationStatus: matched ? "a_faire" : "non_prepare",
          source: "google"
        };
      })
    }
  });
}
