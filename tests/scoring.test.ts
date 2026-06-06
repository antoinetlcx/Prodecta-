import { describe, expect, it } from "vitest";
import { calculateCommercialScore, scoreLabel } from "@/lib/scoring";

describe("commercial scoring", () => {
  it("scores a strong qualified opportunity", () => {
    const score = calculateCommercialScore({
      needExpressed: true,
      clearPain: true,
      businessImpact: true,
      decisionMaker: true,
      budgetDiscussed: true,
      timingKnown: true,
      positiveInterest: true,
      concreteNextStep: true,
      riskSignals: 0,
      objections: 1
    });

    expect(score).toBeGreaterThanOrEqual(90);
    expect(scoreLabel(score)).toBe("Tres chaud");
  });

  it("penalizes unclear next steps and risk signals", () => {
    const score = calculateCommercialScore({
      needExpressed: true,
      clearPain: false,
      businessImpact: false,
      decisionMaker: false,
      budgetDiscussed: false,
      timingKnown: false,
      positiveInterest: true,
      concreteNextStep: false,
      riskSignals: 3,
      objections: 2
    });

    expect(score).toBeLessThan(35);
    expect(scoreLabel(score)).toBe("Risque eleve");
  });
});
