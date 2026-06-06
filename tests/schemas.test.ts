import { describe, expect, it } from "vitest";
import {
  commercialReportSchema,
  liveCoachResponseSchema,
  meetingContextSchema,
  preparationSchema
} from "@/lib/schemas";
import {
  buildLiveCoachFallback,
  buildPreparationFallback,
  buildReportFallback,
  defaultMeetingContext
} from "@/lib/sales-knowledge";

describe("schemas", () => {
  it("accepts the default meeting context", () => {
    expect(meetingContextSchema.parse(defaultMeetingContext).prospectName).toBe(
      "Chateau de Villeneuve"
    );
  });

  it("accepts fallback preparation and report payloads", () => {
    const preparation = buildPreparationFallback(defaultMeetingContext);
    const report = buildReportFallback(
      defaultMeetingContext,
      "Le prospect demande le prix et veut voir avec son associe."
    );

    expect(preparationSchema.parse(preparation).likelyObjections.length).toBeGreaterThan(2);
    expect(commercialReportSchema.parse(report).followups).toHaveLength(3);
  });

  it("accepts live coaching fallback payloads", () => {
    const coaching = buildLiveCoachFallback({
      transcript: "Le prospect trouve le prix eleve et doit voir avec son associe.",
      manualSignals: ["prix"],
      sellerTalkRatio: 64
    });

    const parsed = liveCoachResponseSchema.parse(coaching);
    expect(parsed.events.length).toBeGreaterThan(0);
    expect(parsed.detectedSignals.some((signal) => signal.id === "prix")).toBe(true);
  });
});
