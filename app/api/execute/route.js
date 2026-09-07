import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL,
  MAX_TOKENS,
  errorResponse,
  hasApiKey,
  describeAnthropicError,
} from "@/lib/anthropic";

// Route exécutée exclusivement côté serveur (AD-1) : la clé API n'est lue
// que via process.env et n'est jamais transmise au navigateur.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let prompt;

  try {
    const body = await request.json();
    prompt = body?.prompt;
  } catch {
    return errorResponse("Requête invalide.");
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return errorResponse("Le prompt est vide.");
  }

  if (!hasApiKey()) {
    return errorResponse("Clé API Anthropic absente côté serveur.");
  }

  try {
    const client = new Anthropic();

    // Un unique message, aucun historique de conversation : chaque appel
    // repart d'un contexte neuf et indépendant (AD-3, FR3).
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });

    const output = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (output.length === 0) {
      return errorResponse("L'IA n'a renvoyé aucun texte.");
    }

    return Response.json({ output });
  } catch (error) {
    console.error("[/api/execute]", error);
    return errorResponse(
      describeAnthropicError(error, "Erreur lors de l'appel à l'IA.")
    );
  }
}
