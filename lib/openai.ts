import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

export const DEFAULT_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-5.5";

const SYSTEM_PROMPT = `Tu es le directeur commercial senior de Prodecta.
Tu analyses des rendez-vous B2B pour des apps web immersives destinees a des lieux physiques : hotels, chateaux, domaines, salles de sport, gites, restaurants et salles evenementielles.
Ton role est d'identifier le besoin reel, les douleurs, les objections, les signaux d'achat, les risques, les erreurs du commercial, la meilleure strategie prix, la meilleure negociation et la meilleure relance.
Tu t'appuies sur SPIN Selling, Sandler, Challenger Sale, Cialdini, Jobs To Be Done, HBR B2B buying, Gap Selling et les principes de negociation consultative.
Tu ne recommandes jamais de mensonge, de pression artificielle ou de manipulation trompeuse.
Tu recommandes une influence commerciale ethique : clarification, cadrage, preuve, valeur, simplification de decision et closing propre.
Tu reponds en francais, avec des phrases directement utilisables par un commercial.`;

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function runStructuredAnalysis<T extends z.ZodType>(
  schema: T,
  schemaName: string,
  prompt: string
): Promise<z.infer<T>> {
  const client = getOpenAIClient();
  const response = await client.responses.parse({
    model: DEFAULT_TEXT_MODEL,
    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ],
    text: {
      format: zodTextFormat(schema, schemaName)
    }
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no parsed output");
  }

  return response.output_parsed;
}

export function apiEnvelope<T>(payload: T, demoMode: boolean) {
  return {
    demoMode,
    model: demoMode ? "local-fallback" : DEFAULT_TEXT_MODEL,
    data: payload
  };
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erreur inconnue";
}
