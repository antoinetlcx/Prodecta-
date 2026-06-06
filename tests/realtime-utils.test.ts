import { describe, expect, it } from "vitest";
import {
  completeTranscriptSegment,
  estimateSellerTalkRatio,
  mergeTranscriptDelta,
  normalizeRealtimeTranscriptEvent,
  transcriptSegmentsToText
} from "@/lib/realtime-utils";

describe("realtime transcript helpers", () => {
  it("merges deltas and completes a transcript segment", () => {
    const withDelta = mergeTranscriptDelta([], "item-1", "Bonjour", "micro");
    const withSecondDelta = mergeTranscriptDelta(withDelta, "item-1", " Sophie", "micro");
    const completed = completeTranscriptSegment(withSecondDelta, "item-1", "Bonjour Sophie", "micro");

    expect(completed).toHaveLength(1);
    expect(completed[0].text).toBe("Bonjour Sophie");
    expect(completed[0].speaker).toBe("commercial");
    expect(completed[0].final).toBe(true);
  });

  it("normalizes OpenAI realtime transcription events", () => {
    expect(
      normalizeRealtimeTranscriptEvent({
        type: "conversation.item.input_audio_transcription.delta",
        item_id: "item-2",
        delta: "prix"
      })
    ).toEqual({ kind: "delta", itemId: "item-2", text: "prix" });

    expect(
      normalizeRealtimeTranscriptEvent({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "item-2",
        transcript: "prix"
      })
    ).toEqual({ kind: "completed", itemId: "item-2", text: "prix" });
  });

  it("estimates seller talk ratio from speaker/source metadata", () => {
    const segments = [
      ...completeTranscriptSegment([], "seller", "Je vous explique la valeur.", "micro"),
      ...completeTranscriptSegment([], "prospect", "Quel est le prix ?", "tab")
    ];

    expect(estimateSellerTalkRatio(segments)).toBeGreaterThan(50);
    expect(transcriptSegmentsToText(segments)).toContain("Commercial:");
    expect(transcriptSegmentsToText(segments)).toContain("Prospect:");
  });
});
