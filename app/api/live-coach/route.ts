import { NextResponse } from "next/server";
import { z } from "zod";
import {
  liveCoachResponseSchema,
  liveTranscriptSegmentSchema,
  meetingContextSchema
} from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildLiveCoachFallback, sectorLabels } from "@/lib/sales-knowledge";
import { estimateSellerTalkRatio, transcriptSegmentsToText } from "@/lib/realtime-utils";

const liveCoachPayloadSchema = z.object({
  context: meetingContextSchema,
  transcript: z.string().min(0),
  segments: z.array(liveTranscriptSegmentSchema).default([]),
  manualSignals: z.array(z.string()).default([]),
  currentStepId: z.string().min(0).default("")
});

export async function POST(request: Request) {
  try {
    const payload = liveCoachPayloadSchema.parse(await request.json());
    const transcript =
      payload.transcript.trim() || transcriptSegmentsToText(payload.segments, 6000);
    const sellerTalkRatio = estimateSellerTalkRatio(payload.segments);

    if (!hasOpenAIKey()) {
      return NextResponse.json(
        apiEnvelope(
          buildLiveCoachFallback({
            transcript,
            manualSignals: payload.manualSignals,
            sellerTalkRatio
          }),
          true
        )
      );
    }

    const prompt = `Tu es le coach commercial live de Prodecta.
Tu observes un rendez-vous B2B en cours et tu dois aider le commercial sans manipuler le prospect.
Detecte les signaux d'achat, objections, biais psychologiques utiles de facon ethique, risques, erreurs d'ecoute et prochaine meilleure question.
Reste actionnable : chaque evenement doit contenir une phrase exacte a dire, une question, une erreur a eviter et le levier psychologique associe.

Contexte RDV:
- Prospect: ${payload.context.prospectName}
- Interlocuteur: ${payload.context.contactName || "non precise"}
- Secteur: ${sectorLabels[payload.context.sector]}
- Objectif: ${payload.context.objective}
- Offre: ${payload.context.offer || "non precisee"}
- Etape copilot active: ${payload.currentStepId || "non precisee"}
- Ratio parole commercial estime: ${sellerTalkRatio}/100
- Signaux manuels deja cliques: ${payload.manualSignals.join(", ") || "aucun"}

Transcript live recent:
${transcript || "Aucun transcript exploitable pour l'instant."}`;

    const data = await runStructuredAnalysis(liveCoachResponseSchema, "live_coach_response", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
