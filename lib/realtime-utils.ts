import type {
  LiveCoachingEvent,
  LiveSignalDetection,
  LiveTranscriptSegment
} from "./types";

export type RealtimeTranscriptEvent =
  | {
      kind: "delta";
      itemId: string;
      text: string;
    }
  | {
      kind: "completed";
      itemId: string;
      text: string;
    }
  | {
      kind: "error";
      itemId: string;
      text: string;
    };

export function createStableId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

export function normalizeRealtimeTranscriptEvent(event: unknown): RealtimeTranscriptEvent | null {
  if (!event || typeof event !== "object") return null;

  const raw = event as Record<string, unknown>;
  const type = String(raw.type ?? "");
  const itemId = String(raw.item_id ?? raw.itemId ?? raw.response_id ?? createStableId("live"));

  if (type === "conversation.item.input_audio_transcription.delta") {
    return { kind: "delta", itemId, text: String(raw.delta ?? "") };
  }

  if (type === "conversation.item.input_audio_transcription.completed") {
    return { kind: "completed", itemId, text: String(raw.transcript ?? "") };
  }

  if (type === "response.audio_transcript.delta") {
    return { kind: "delta", itemId, text: String(raw.delta ?? "") };
  }

  if (type === "response.audio_transcript.done") {
    return { kind: "completed", itemId, text: String(raw.transcript ?? "") };
  }

  if (type === "error") {
    const error = raw.error && typeof raw.error === "object" ? raw.error : {};
    return {
      kind: "error",
      itemId,
      text: String((error as Record<string, unknown>).message ?? "Erreur Realtime")
    };
  }

  return null;
}

export function mergeTranscriptDelta(
  segments: LiveTranscriptSegment[],
  itemId: string,
  delta: string,
  source: LiveTranscriptSegment["source"] = "mixed"
): LiveTranscriptSegment[] {
  if (!delta) return segments;

  const index = segments.findIndex((segment) => segment.id === itemId);
  if (index === -1) {
    return [
      ...segments,
      {
        id: itemId,
        text: delta,
        speaker: source === "micro" ? "commercial" : source === "tab" ? "prospect" : "unknown",
        source,
        final: false,
        startedAt: new Date().toISOString()
      }
    ];
  }

  return segments.map((segment, segmentIndex) =>
    segmentIndex === index
      ? {
          ...segment,
          text: `${segment.text}${delta}`,
          final: false
        }
      : segment
  );
}

export function completeTranscriptSegment(
  segments: LiveTranscriptSegment[],
  itemId: string,
  transcript: string,
  source: LiveTranscriptSegment["source"] = "mixed"
): LiveTranscriptSegment[] {
  const index = segments.findIndex((segment) => segment.id === itemId);
  const endedAt = new Date().toISOString();

  if (index === -1) {
    return [
      ...segments,
      {
        id: itemId,
        text: transcript,
        speaker: source === "micro" ? "commercial" : source === "tab" ? "prospect" : "unknown",
        source,
        final: true,
        startedAt: endedAt,
        endedAt
      }
    ];
  }

  return segments.map((segment, segmentIndex) =>
    segmentIndex === index
      ? {
          ...segment,
          text: transcript || segment.text,
          final: true,
          endedAt
        }
      : segment
  );
}

export function transcriptSegmentsToText(segments: LiveTranscriptSegment[], maxChars = 6000): string {
  const text = segments
    .slice(-40)
    .map((segment) => {
      const speaker =
        segment.speaker === "commercial"
          ? "Commercial"
          : segment.speaker === "prospect"
            ? "Prospect"
            : "Interlocuteur";
      return `${speaker}: ${segment.text.trim()}`;
    })
    .filter((line) => line.length > 16)
    .join("\n");

  return text.slice(Math.max(0, text.length - maxChars));
}

export function estimateSellerTalkRatio(segments: LiveTranscriptSegment[]): number {
  let seller = 0;
  let prospect = 0;
  let unknown = 0;

  for (const segment of segments) {
    const length = segment.text.trim().length;
    if (!length) continue;

    if (segment.speaker === "commercial" || segment.source === "micro") seller += length;
    else if (segment.speaker === "prospect" || segment.source === "tab") prospect += length;
    else unknown += length;
  }

  seller += unknown / 2;
  prospect += unknown / 2;

  const total = seller + prospect;
  if (!total) return 50;
  return Math.max(0, Math.min(100, Math.round((seller / total) * 100)));
}

export function mergeUniqueCoachingEvents(
  current: LiveCoachingEvent[],
  next: LiveCoachingEvent[]
): LiveCoachingEvent[] {
  const known = new Set(current.map((event) => event.id));
  return [...next.filter((event) => !known.has(event.id)), ...current].slice(0, 10);
}

export function mergeUniqueSignals(
  current: LiveSignalDetection[],
  next: LiveSignalDetection[]
): LiveSignalDetection[] {
  const byId = new Map<string, LiveSignalDetection>();
  [...next, ...current].forEach((signal) => byId.set(signal.id, signal));
  return Array.from(byId.values()).slice(0, 8);
}
