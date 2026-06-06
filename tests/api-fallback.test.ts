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

  it("live-coach returns structured demo coaching without OpenAI key", async () => {
    const { POST } = await import("@/app/api/live-coach/route");
    const { defaultMeetingContext } = await import("@/lib/sales-knowledge");

    const response = await POST(
      new Request("http://localhost/api/live-coach", {
        method: "POST",
        body: JSON.stringify({
          context: defaultMeetingContext,
          transcript: "Le prix est interessant mais je dois voir avec mon associe.",
          segments: [],
          manualSignals: ["prix"],
          currentStepId: "prix"
        })
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.demoMode).toBe(true);
    expect(json.data.events.length).toBeGreaterThan(0);
    expect(json.data.detectedSignals.some((signal: { id: string }) => signal.id === "prix")).toBe(true);
  });

  it("realtime session refuses to start without an OpenAI key", async () => {
    const { GET, POST } = await import("@/app/api/realtime/session/route");

    const readiness = await GET();
    const readinessJson = await readiness.json();
    expect(readiness.status).toBe(200);
    expect(readinessJson.configured).toBe(false);
    expect(readinessJson.error).toContain("OPENAI_API_KEY");

    const response = await POST(
      new Request("http://localhost/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: "v=0"
      })
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("OPENAI_API_KEY");
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

  it("integration status never exposes local tokens", async () => {
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
      expect(raw).not.toContain("secret-airtable-token");
    } finally {
      if (previousStorePath === undefined) delete process.env.PRODECTA_INTEGRATION_STORE_PATH;
      else process.env.PRODECTA_INTEGRATION_STORE_PATH = previousStorePath;
      if (previousAirtable === undefined) delete process.env.AIRTABLE_TOKEN;
      else process.env.AIRTABLE_TOKEN = previousAirtable;
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("integration routes stay usable without external credentials", async () => {
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
      const { POST: createDraft } = await import("@/app/api/integrations/gmail/create-draft/route");
      const { POST: linkedinDraft } = await import("@/app/api/integrations/linkedin/draft/route");

      const airtable = await discoverAirtable();
      const calendar = await importCalendar();
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
      const linkedin = await linkedinDraft(
        new Request("http://localhost/api/integrations/linkedin/draft", {
          method: "POST",
          body: JSON.stringify({
            prospectName: "Chateau test",
            contactName: "Sophie",
            profileUrl: ""
          })
        })
      );

      const airtableJson = await airtable.json();
      const calendarJson = await calendar.json();
      const gmailJson = await gmail.json();
      const linkedinJson = await linkedin.json();

      expect(airtable.status).toBe(200);
      expect(airtableJson.data.state).toBe("needs_reauth");
      expect(calendarJson.demoMode).toBe(true);
      expect(calendarJson.data.meetings.length).toBeGreaterThan(0);
      expect(gmailJson.data.sent).toBe(false);
      expect(gmailJson.data.message).toContain("aucun email envoye");
      expect(linkedinJson.data.sent).toBe(false);
      expect(linkedinJson.data.draft.text).toContain("Chateau test");
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
