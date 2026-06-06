import { NextResponse } from "next/server";
import { z } from "zod";
import { meetingContextSchema, preparationSchema } from "@/lib/schemas";
import { apiEnvelope, apiErrorMessage, hasOpenAIKey, runStructuredAnalysis } from "@/lib/openai";
import { buildPreparationFallback, sectorLabels } from "@/lib/sales-knowledge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const context = meetingContextSchema.parse(body);

    if (!hasOpenAIKey()) {
      return NextResponse.json(apiEnvelope(buildPreparationFallback(context), true));
    }

    const prompt = `Prepare un rendez-vous commercial Prodecta.
Prospect: ${context.prospectName}
Interlocuteur: ${context.contactName || "non precise"}
Secteur: ${sectorLabels[context.sector]}
Type de RDV: ${context.meetingType}
Maturite: ${context.maturity}
Objectif: ${context.objective}
Contexte connu: ${context.knownContext}
Site: ${context.website}
Offre envisagee: ${context.offer}
Exemples a montrer: ${context.examplesToShow}

Produis un plan avant RDV concret, centre sur la vente consultative, les biais psychologiques utiles et l'influence ethique.`;

    const data = await runStructuredAnalysis(preparationSchema, "rdv_preparation", prompt);
    return NextResponse.json(apiEnvelope(data, false));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
