import { NextResponse } from "next/server";
import {
  DEFAULT_TRANSCRIBE_FALLBACK_MODEL,
  DEFAULT_TRANSCRIBE_MODEL,
  apiErrorMessage,
  getOpenAIClient,
  hasOpenAIKey
} from "@/lib/openai";

export async function POST(request: Request) {
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      {
        demoMode: true,
        model: "local-fallback",
        data: {
          transcript:
            "Mode demo sans cle API. Collez un transcript ou ajoutez OPENAI_API_KEY dans .env.local pour transcrire un audio reel."
        }
      },
      { status: 200 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier audio fourni." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const isDiarize = DEFAULT_TRANSCRIBE_MODEL.includes("diarize");
    let model = DEFAULT_TRANSCRIBE_MODEL;
    let transcription: unknown;

    try {
      transcription = await client.audio.transcriptions.create(
        {
          file,
          model,
          response_format: isDiarize ? "diarized_json" : "text",
          ...(isDiarize ? { chunking_strategy: "auto" } : {})
        } as Parameters<typeof client.audio.transcriptions.create>[0]
      );
    } catch (error) {
      if (!isDiarize) throw error;
      model = DEFAULT_TRANSCRIBE_FALLBACK_MODEL;
      transcription = await client.audio.transcriptions.create({
        file,
        model,
        response_format: "text"
      });
    }

    const transcript = extractTranscriptText(transcription);

    return NextResponse.json({
      demoMode: false,
      model,
      data: { transcript }
    });
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error) }, { status: 500 });
  }
}

function extractTranscriptText(transcription: unknown): string {
  if (typeof transcription === "string") return transcription;
  if (!transcription || typeof transcription !== "object") return String(transcription ?? "");

  const payload = transcription as Record<string, unknown>;
  if (typeof payload.text === "string") return payload.text;

  if (Array.isArray(payload.segments)) {
    return payload.segments
      .map((segment) => {
        if (!segment || typeof segment !== "object") return "";
        const item = segment as Record<string, unknown>;
        const speaker = typeof item.speaker === "string" ? `${item.speaker}: ` : "";
        return `${speaker}${String(item.text ?? "")}`.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  return JSON.stringify(payload);
}
