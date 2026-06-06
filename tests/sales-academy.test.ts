import { describe, expect, it } from "vitest";
import {
  buildNegotiationFallback,
  buildObjectionFallback,
  objectionPlaybook,
  trainingDrills,
  trainingModules
} from "@/lib/sales-knowledge";

describe("sales academy content", () => {
  it("contains the major sales training modules", () => {
    const titles = trainingModules.map((module) => module.title);

    expect(titles).toContain("SPIN Selling");
    expect(titles).toContain("Sandler Selling System");
    expect(titles).toContain("Challenger Sale");
    expect(titles).toContain("MEDDIC + BANT");
    expect(titles).toContain("Gap Selling");
    expect(titles).toContain("Cialdini, version ethique");
    expect(
      trainingModules.find((module) => module.id === "cialdini")?.howToApply.join(" ")
    ).toContain("influence oui, pression non");
    expect(trainingDrills.length).toBeGreaterThanOrEqual(4);
  });

  it("contains the key objection playbook entries", () => {
    const ids = objectionPlaybook.map((item) => item.id);

    expect(ids).toEqual(
      expect.arrayContaining(["prix", "pas-argent", "associe", "pas-prioritaire", "concurrence"])
    );
  });

  it("contextualizes no-money and price objections", () => {
    const objection = buildObjectionFallback({
      objection: "elle veut pas d'argent, c'est trop cher",
      context: "La direction veut limiter le risque financier.",
      price: "18 000 - 28 000 EUR"
    });
    const negotiation = buildNegotiationFallback({
      objection: "elle veut pas d'argent, c'est trop cher",
      context: "La direction veut limiter le risque financier.",
      price: "18 000 - 28 000 EUR"
    });

    expect(objection.phraseToSay).toContain("perimetre essentiel");
    expect(objection.questionToAsk).toContain("budget impossible");
    expect(negotiation.recommendedStrategy).toBe("reduire_perimetre");
    expect(negotiation.nextStep).toContain("version essentielle");
  });
});
