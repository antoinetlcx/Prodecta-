import { NextResponse } from "next/server";
import { z } from "zod";
import { followupStrategySchema } from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildFollowupFallback } from "@/lib/sales-knowledge";

const payloadSchema = z.object({
  prospectName: z.string().min(1),
  conversation: z.string().min(0),
  notes: z.string().min(0),
  lastReply: z.string().min(0),
  daysSinceLastExchange: z.number().int().min(0).max(365),
  goal: z.string().min(1),
  pressureLevel: z.string().min(1),
  channel: z.string().min(1),
  priceProposed: z.string().min(0)
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const context = JSON.stringify(payload, null, 2);

    if (!hasOpenAIKey()) {
      return NextResponse.json(apiEnvelope(buildFollowupFallback(context), true));
    }

    const prompt = `Tu es le Relance Lab de Prodecta.
Analyse cette situation et recommande la meilleure relance.
Tu dois dire s'il faut relancer maintenant ou attendre, quel angle utiliser, quel canal choisir, quelle posture prix adopter, puis ecrire email, SMS et LinkedIn.

Donnees:
${context}`;

    const data = await runStructuredAnalysis(followupStrategySchema, "followup_strategy", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
