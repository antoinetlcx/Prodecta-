import { z } from "zod";
import { getGoogleAccessToken, patchIntegrationStore, readIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const draftSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  prospectName: z.string().min(0).optional()
});

function base64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function POST(request: Request) {
  const parsed = draftSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const store = await readIntegrationStore();
  const token = getGoogleAccessToken(store);

  if (!token) {
    return Response.json({
      demoMode: true,
      data: {
        state: "not_configured",
        created: false,
        sent: false,
        message: "Gmail non connecte : brouillon simule, aucun email envoye.",
        draft: parsed.data
      }
    });
  }

  const raw = [
    `To: ${parsed.data.to}`,
    `Subject: ${parsed.data.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    parsed.data.body
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: { raw: base64Url(raw) } })
  });

  if (!response.ok) {
    return Response.json({ error: `Creation brouillon Gmail impossible (${response.status})` }, { status: 502 });
  }

  const draft = (await response.json()) as { id?: string; message?: { id?: string } };
  await patchIntegrationStore((current) => ({
    ...current,
    gmail: { lastDraftAt: new Date().toISOString() }
  }));

  return Response.json({
    demoMode: false,
    data: {
      state: "connected",
      created: true,
      sent: false,
      message: "Brouillon Gmail cree. Aucun envoi automatique.",
      draft
    }
  });
}
