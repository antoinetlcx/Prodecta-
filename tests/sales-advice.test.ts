import { describe, expect, it } from "vitest";
import { buildSalesAdvice } from "@/lib/sales-advice";
import type { SalesProspect } from "@/lib/types";

const hotProspect: SalesProspect = {
  id: "p1",
  name: "Sophie",
  company: "Chateau test",
  email: "sophie@example.com",
  sector: "chateau_domaine",
  pipelineStatus: "chaud",
  lastContactAt: "2026-06-01T10:00:00+02:00",
  nextAction: "",
  potentialAmount: 24000
};

describe("sales advice engine", () => {
  it("flags hot prospects without recent next step", () => {
    const advice = buildSalesAdvice({ prospect: hotProspect, now: "2026-06-06T10:00:00+02:00" });

    expect(advice.some((item) => item.title.includes("Prospect chaud"))).toBe(true);
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
});
