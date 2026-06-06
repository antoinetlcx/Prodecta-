import { describe, expect, it } from "vitest";
import {
  buildFollowupTemplate,
  buildMeetingPreparation,
  buildSalesAdvice,
  scoreProspectPriority
} from "@/lib/sales-advice";
import type { SalesProspect } from "@/lib/types";

const hotProspect: SalesProspect = {
  id: "p1",
  name: "Sophie",
  company: "Chateau test",
  email: "sophie@example.com",
  sector: "chateau_domaine",
  pipelineStatus: "Purchase",
  pipelineStatusRaw: "Purchase",
  isPurchase: true,
  lastContactAt: "2026-06-01T10:00:00+02:00",
  nextAction: "",
  nextActionDate: "2026-06-06T10:00:00+02:00",
  potentialAmount: 24000,
  enrichedNotes: "Tres interessee, devis a relancer"
};

describe("sales advice engine", () => {
  it("scores Purchase prospects without next step as urgent", () => {
    const score = scoreProspectPriority(hotProspect, "2026-06-06T10:00:00+02:00");
    const advice = buildSalesAdvice({ prospect: hotProspect, now: "2026-06-06T10:00:00+02:00" });

    expect(score.isPurchase).toBe(true);
    expect(score.priorityLevel).toBe("urgent");
    expect(score.priorityReasons).toContain("Purchase sans prochaine action");
    expect(advice.some((item) => item.title.includes("Purchase prioritaire"))).toBe(true);
    expect(advice.some((item) => item.title.includes("next step"))).toBe(true);
  });

  it("adds sector and objection guidance without OpenAI", () => {
    const advice = buildSalesAdvice({
      prospect: { ...hotProspect, sector: "hotel" },
      objection: "c'est trop cher",
      now: "2026-06-06T10:00:00+02:00"
    });

    expect(advice.map((item) => item.title)).toContain("Objection prix detectee");
    expect(advice.map((item) => item.title)).toContain("Angle hotel / gite");
    expect(advice.find((item) => item.title === "Objection prix detectee")?.template).toContain("cout");
  });

  it("builds local followup templates and meeting prep without OpenAI", () => {
    const template = buildFollowupTemplate(hotProspect, "devis");
    const prep = buildMeetingPreparation({ prospect: hotProspect });

    expect(template).toContain("devis Prodecta");
    expect(template).toContain("Paul De Talancé");
    expect(prep.questions.length).toBeGreaterThan(6);
    expect(prep.prodectaPitch).toContain("outil commercial");
  });
});
