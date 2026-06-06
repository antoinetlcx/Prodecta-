import { NextResponse } from "next/server";
import { z } from "zod";
import { commercialReportSchema, meetingContextSchema } from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildReportFallback, sectorLabels } from "@/lib/sales-knowledge";

const analyzePayloadSchema = z.object({
  context: meetingContextSchema,
  transcript: z.string().min(0),
  notes: z.string().min(0),
  extraContext: z.string().min(0)
});

export async function POST(request: Request) {
  try {
    const body = analyzePayloadSchema.parse(await request.json());
    const transcript = [body.transcript, body.notes, body.extraContext].filter(Boolean).join("\n\n");

    if (!hasOpenAIKey()) {
      return NextResponse.json(apiEnvelope(buildReportFallback(body.context, transcript), true));
    }

    const prompt = `Analyse ce rendez-vous Prodecta et sors le rapport commercial complet en 15 sections.

Contexte:
- Prospect: ${body.context.prospectName}
- Interlocuteur: ${body.context.contactName || "non precise"}
- Secteur: ${sectorLabels[body.context.sector]}
- Type: ${body.context.meetingType}
- Objectif initial: ${body.context.objective}
- Offre discutee: ${body.context.offer}
- Prix annonce ou envisage: ${body.context.priceDiscussed || "non precise"}
- Consentement obtenu: ${body.context.consentObtained ? "oui" : "non"}

Transcript / notes:
${transcript || "Aucun transcript. Base-toi sur le contexte et signale les limites."}

Analyse aussi la performance du commercial : cadrage, diagnostic, ecoute, valeur, objections, closing.
Repere les biais psychologiques utiles pendant le call, mais reste strictement ethique.`;

    const data = await runStructuredAnalysis(commercialReportSchema, "commercial_report", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
