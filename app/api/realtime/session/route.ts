import { NextResponse } from "next/server";
import {
  DEFAULT_REALTIME_TRANSCRIBE_MODEL,
  apiErrorMessage,
  hasOpenAIKey
} from "@/lib/openai";

export const runtime = "nodejs";

export async function GET() {
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "OPENAI_API_KEY manquante. Ajoutez-la dans .env.local puis relancez npm run dev pour activer l'ecoute active Realtime."
      }
    );
  }

  return NextResponse.json({
    configured: true,
    model: DEFAULT_REALTIME_TRANSCRIBE_MODEL
  });
}

export async function POST(request: Request) {
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY manquante. Ajoutez-la dans .env.local puis relancez npm run dev pour activer l'ecoute active Realtime."
      },
      { status: 401 }
    );
  }

  try {
    const sdp = await request.text();
    if (!sdp.trim()) {
      return NextResponse.json({ error: "SDP WebRTC manquant." }, { status: 400 });
    }

    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify(buildRealtimeSessionConfig()));

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Safety-Identifier": "prodecta-local-user"
      },
      body: form
    });

    const answer = await response.text();
    if (!response.ok) {
      return new NextResponse(answer || "Session Realtime impossible.", {
        status: response.status,
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
    }

    return new NextResponse(answer, {
      status: 200,
      headers: { "Content-Type": "application/sdp" }
    });
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error) }, { status: 500 });
  }
}

function buildRealtimeSessionConfig() {
  return {
    type: "transcription",
    audio: {
      input: {
        transcription: {
          model: DEFAULT_REALTIME_TRANSCRIBE_MODEL,
          language: "fr",
          delay: "low"
        }
      }
    }
  };
}
