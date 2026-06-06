import { describe, expect, it } from "vitest";
import {
  commercialReportSchema,
  meetingContextSchema,
  preparationSchema
} from "@/lib/schemas";
import {
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
});
