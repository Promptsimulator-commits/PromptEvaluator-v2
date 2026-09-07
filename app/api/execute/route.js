import Anthropic from "@anthropic-ai/sdk";

// Route exécutée exclusivement côté serveur (AD-1) : la clé API n'est lue
// que via process.env et n'est jamais transmise au navigateur.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 4096;

export async function POST(request) {
  let prompt;

  try {
    const body = await request.json();
    prompt = body?.prompt;
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 500 });
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Le prompt est vide." }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Clé API Anthropic absente côté serveur." },
      { status: 500 }
    );
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
      return Response.json(
        { error: "L'IA n'a renvoyé aucun texte." },
        { status: 500 }
      );
    }

    return Response.json({ output });
  } catch (error) {
    let error_message = "Erreur lors de l'appel à l'IA.";

    if (error instanceof Anthropic.AuthenticationError) {
      error_message = "Clé API Anthropic invalide.";
    } else if (error instanceof Anthropic.RateLimitError) {
      error_message = "Trop d'appels à l'IA, réessayez dans un instant.";
    } else if (error instanceof Anthropic.APIError) {
      error_message = `Erreur de l'API Anthropic (${error.status}).`;
    }

    console.error("[/api/execute]", error);
    return Response.json({ error: error_message }, { status: 500 });
  }
}
