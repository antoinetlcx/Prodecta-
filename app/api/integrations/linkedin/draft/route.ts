import { z } from "zod";
import { patchIntegrationStore } from "@/lib/server-integrations";

export const runtime = "nodejs";

const linkedinSchema = z.object({
  prospectName: z.string().min(1),
  contactName: z.string().min(0).optional(),
  profileUrl: z.string().min(0).optional(),
  context: z.string().min(0).optional(),
  objective: z.string().min(0).optional()
});

export async function POST(request: Request) {
  const parsed = linkedinSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
  }

  const contact = parsed.data.contactName || "Bonjour";
  const message = `${contact}, je me permets de vous envoyer un court recap sur ${parsed.data.prospectName}. L'objectif n'est pas de pousser un outil de plus, mais de voir si une experience immersive peut aider vos visiteurs a mieux comprendre, se projeter et avancer plus simplement. Si c'est utile, je peux vous envoyer deux scenarios clairs.`;

  await patchIntegrationStore((current) => ({
    ...current,
    linkedin: { mode: "assisted", lastDraftAt: new Date().toISOString() }
  }));

  return Response.json({
    demoMode: false,
    data: {
      state: "assisted",
      sent: false,
      message: "Message LinkedIn pret a copier. Aucun envoi automatique.",
      draft: {
        profileUrl: parsed.data.profileUrl || "",
        text: message,
        objective: parsed.data.objective || "ouvrir une conversation utile"
      }
    }
  });
}
