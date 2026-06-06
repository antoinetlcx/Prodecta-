import { NextResponse } from "next/server";
import { z } from "zod";
import { negotiationStrategySchema } from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildNegotiationFallback } from "@/lib/sales-knowledge";

const payloadSchema = z.object({
  prospectName: z.string().min(1),
  context: z.string().min(0),
  price: z.string().min(0),
  objection: z.string().min(0),
  objective: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const context = JSON.stringify(payload, null, 2);

    if (!hasOpenAIKey()) {
      return NextResponse.json(apiEnvelope(buildNegotiationFallback(payload), true));
    }

    const prompt = `Prepare une strategie de negociation pour Prodecta.
Choisis entre defendre le prix, deux options, reduire le perimetre, concession avec contrepartie, ou retrait elegant.
Ne recommande jamais une remise sans contrepartie.

Donnees:
${context}`;

    const data = await runStructuredAnalysis(negotiationStrategySchema, "negotiation_strategy", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
