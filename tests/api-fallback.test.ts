import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/openai")>("@/lib/openai");
  return {
    ...actual,
    hasOpenAIKey: () => false,
    runStructuredAnalysis: vi.fn()
  };
});

describe("api fallback mode", () => {
  it("prepare-rdv returns local demo data without OpenAI key", async () => {
    const { POST } = await import("@/app/api/prepare-rdv/route");
    const { defaultMeetingContext } = await import("@/lib/sales-knowledge");

    const response = await POST(
      new Request("http://localhost/api/prepare-rdv", {
        method: "POST",
        body: JSON.stringify(defaultMeetingContext)
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.demoMode).toBe(true);
    expect(json.data.primaryAngle).toContain("valeur physique");
  });

  it("objection and negotiation fallbacks use full price context", async () => {
    const { POST: objectionPost } = await import("@/app/api/objection/route");
    const { POST: negotiationPost } = await import("@/app/api/negociation/route");

    const objectionResponse = await objectionPost(
      new Request("http://localhost/api/objection", {
        method: "POST",
        body: JSON.stringify({
          objection: "elle veut pas d'argent, c'est trop cher",
          context: "La direction a peur du risque financier.",
          meetingMoment: "Pendant RDV"
        })
      })
    );
    const negotiationResponse = await negotiationPost(
      new Request("http://localhost/api/negociation", {
        method: "POST",
        body: JSON.stringify({
          prospectName: "Chateau test",
          context: "La direction a peur du risque financier.",
          price: "18 000 - 28 000 EUR",
          objection: "elle veut pas d'argent, c'est trop cher",
          objective: "defendre la valeur"
        })
      })
    );

    const objectionJson = await objectionResponse.json();
    const negotiationJson = await negotiationResponse.json();

    expect(objectionJson.data.phraseToSay).toContain("perimetre essentiel");
    expect(negotiationJson.data.recommendedStrategy).toBe("reduire_perimetre");
  });

  it("integration status exposes connected dashboard services without tokens", async () => {
    const previousStorePath = process.env.PRODECTA_INTEGRATION_STORE_PATH;
    const previousAirtable = process.env.AIRTABLE_TOKEN;
    const tempDir = await mkdtemp(join(tmpdir(), "prodecta-integrations-"));
    process.env.PRODECTA_INTEGRATION_STORE_PATH = join(tempDir, "integrations.json");
    process.env.AIRTABLE_TOKEN = "secret-airtable-token";

    try {
      const { GET } = await import("@/app/api/integrations/status/route");
      const response = await GET();
      const json = await response.json();
      const raw = JSON.stringify(json);

      expect(response.status).toBe(200);
      expect(raw).toContain("Airtable Prodecta");
      expect(raw).toContain("Google Tasks");
      expect(raw).toContain("OpenAI");
      expect(raw).not.toContain("secret-airtable-token");
    } finally {
      if (previousStorePath === undefined) delete process.env.PRODECTA_INTEGRATION_STORE_PATH;
      else process.env.PRODECTA_INTEGRATION_STORE_PATH = previousStorePath;
      if (previousAirtable === undefined) delete process.env.AIRTABLE_TOKEN;
      else process.env.AIRTABLE_TOKEN = previousAirtable;
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("commercial integration routes stay usable without external credentials", async () => {
    const previousStorePath = process.env.PRODECTA_INTEGRATION_STORE_PATH;
    const previousAirtableToken = process.env.AIRTABLE_TOKEN;
    const previousAirtableKey = process.env.AIRTABLE_API_KEY;
    const previousGoogleAccess = process.env.GOOGLE_ACCESS_TOKEN;
    const previousGoogleRefresh = process.env.GOOGLE_REFRESH_TOKEN;
    const tempDir = await mkdtemp(join(tmpdir(), "prodecta-integrations-"));
    process.env.PRODECTA_INTEGRATION_STORE_PATH = join(tempDir, "integrations.json");
    delete process.env.AIRTABLE_TOKEN;
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.GOOGLE_ACCESS_TOKEN;
    delete process.env.GOOGLE_REFRESH_TOKEN;

    try {
      const { POST: discoverAirtable } = await import("@/app/api/integrations/airtable/discover/route");
      const { POST: importCalendar } = await import("@/app/api/integrations/calendar/import/route");
      const { POST: listTasks } = await import("@/app/api/integrations/tasks/list/route");
      const { POST: createTask } = await import("@/app/api/integrations/tasks/create/route");
      const { POST: createDraft } = await import("@/app/api/integrations/gmail/create-draft/route");
      const { POST: prospects } = await import("@/app/api/integrations/airtable/prospects/route");

      const airtable = await discoverAirtable();
      const calendar = await importCalendar();
      const tasks = await listTasks(new Request("http://localhost/api/integrations/tasks/list", {
        method: "POST",
        body: JSON.stringify({})
      }));
      const task = await createTask(
        new Request("http://localhost/api/integrations/tasks/create", {
          method: "POST",
          body: JSON.stringify({ title: "Relancer Chateau test" })
        })
      );
      const gmail = await createDraft(
        new Request("http://localhost/api/integrations/gmail/create-draft", {
          method: "POST",
          body: JSON.stringify({
            to: "prospect@example.com",
            subject: "Relance Prodecta",
            body: "Bonjour, voici un recap."
          })
        })
      );
      const airtableProspects = await prospects(
        new Request("http://localhost/api/integrations/airtable/prospects", {
          method: "POST",
          body: JSON.stringify({ limit: 5 })
        })
      );

      const airtableJson = await airtable.json();
      const calendarJson = await calendar.json();
      const tasksJson = await tasks.json();
      const taskJson = await task.json();
      const gmailJson = await gmail.json();
      const prospectsJson = await airtableProspects.json();

      expect(airtable.status).toBe(200);
      expect(airtableJson.data.state).toBe("needs_reauth");
      expect(calendarJson.demoMode).toBe(true);
      expect(calendarJson.data.meetings.length).toBeGreaterThan(0);
      expect(tasksJson.demoMode).toBe(true);
      expect(tasksJson.data.tasks.length).toBeGreaterThan(0);
      expect(taskJson.data.task.title).toContain("Relancer");
      expect(gmailJson.data.sent).toBe(false);
      expect(gmailJson.data.message).toContain("aucun email envoye");
      expect(prospectsJson.data.prospects.length).toBeGreaterThan(0);
    } finally {
      if (previousStorePath === undefined) delete process.env.PRODECTA_INTEGRATION_STORE_PATH;
      else process.env.PRODECTA_INTEGRATION_STORE_PATH = previousStorePath;
      if (previousAirtableToken === undefined) delete process.env.AIRTABLE_TOKEN;
      else process.env.AIRTABLE_TOKEN = previousAirtableToken;
      if (previousAirtableKey === undefined) delete process.env.AIRTABLE_API_KEY;
      else process.env.AIRTABLE_API_KEY = previousAirtableKey;
      if (previousGoogleAccess === undefined) delete process.env.GOOGLE_ACCESS_TOKEN;
      else process.env.GOOGLE_ACCESS_TOKEN = previousGoogleAccess;
      if (previousGoogleRefresh === undefined) delete process.env.GOOGLE_REFRESH_TOKEN;
      else process.env.GOOGLE_REFRESH_TOKEN = previousGoogleRefresh;
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
