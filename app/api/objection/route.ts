import { NextResponse } from "next/server";
import { z } from "zod";
import { objectionStrategySchema } from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildObjectionFallback } from "@/lib/sales-knowledge";

const payloadSchema = z.object({
  objection: z.string().min(1),
  context: z.string().min(0),
  meetingMoment: z.string().min(0)
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const context = JSON.stringify(payload, null, 2);

    if (!hasOpenAIKey()) {
      return NextResponse.json(
        apiEnvelope(
          buildObjectionFallback({
            objection: payload.objection,
            context: payload.context
          }),
          true
        )
      );
    }

    const prompt = `Analyse cette objection commerciale pendant un RDV Prodecta.
Donne le diagnostic, le vrai frein probable, les leviers psychologiques utiles de facon ethique, la question a poser, la phrase a dire et l'erreur a eviter.

Donnees:
${context}`;

    const data = await runStructuredAnalysis(objectionStrategySchema, "objection_strategy", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
