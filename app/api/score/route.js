import Anthropic from "@anthropic-ai/sdk";

// Route exécutée exclusivement côté serveur (AD-1) : la clé API n'est lue
// que via process.env et n'est jamais transmise au navigateur.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `Tu es un évaluateur rigoureux. On te donne un résultat produit par une IA, et une liste de critères d'acceptation rédigés par un utilisateur.

Pour chaque critère, dans l'ordre exact où il t'est donné, tu juges si le résultat le respecte.

Règles :
- Juge le fond, pas la présence de mots-clés : un critère peut être respecté avec une formulation différente de celle du critère.
- En cas de doute réel, considère le critère comme non respecté — mieux vaut être exigeant qu'indulgent.
- L'explication est courte (une phrase) et dit *pourquoi*, en citant ce qui, dans le résultat, justifie ton jugement.
- Renvoie exactement un verdict par critère, dans le même ordre, sans en ajouter ni en omettre.`;

// L'outil n'est pas exécuté : il sert uniquement à imposer la forme de la
// réponse. Sans cela le modèle répondrait en texte libre, impossible à
// exploiter de façon fiable.
const SCORING_TOOL = {
  name: "rendre_verdicts",
  description:
    "Renvoie le verdict pour chaque critère d'acceptation, dans l'ordre où ils ont été fournis.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        description:
          "Un élément par critère, dans le même ordre que la liste fournie.",
        items: {
          type: "object",
          properties: {
            passed: {
              type: "boolean",
              description: "true si le résultat respecte ce critère.",
            },
            explanation: {
              type: "string",
              description: "Une phrase justifiant le verdict.",
            },
          },
          required: ["passed", "explanation"],
          additionalProperties: false,
        },
      },
    },
    required: ["results"],
    additionalProperties: false,
  },
};

export async function POST(request) {
  let output;
  let criteria;

  try {
    const body = await request.json();
    output = body?.output;
    criteria = body?.criteria;
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 500 });
  }

  if (typeof output !== "string" || output.trim().length === 0) {
    return Response.json(
      { error: "Le résultat à noter est vide." },
      { status: 500 }
    );
  }

  if (!Array.isArray(criteria) || criteria.length === 0) {
    return Response.json({ error: "Aucun critère à évaluer." }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Clé API Anthropic absente côté serveur." },
      { status: 500 }
    );
  }

  const userMessage = [
    "Résultat à évaluer :",
    "---",
    output,
    "---",
    "",
    "Critères d'acceptation, dans l'ordre :",
    ...criteria.map((criterion, index) => `${index + 1}. ${criterion}`),
  ].join("\n");

  try {
    const client = new Anthropic();

    // Un unique message, aucun historique de conversation : chaque notation
    // repart d'un contexte neuf et indépendant (AD-3, FR4).
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [SCORING_TOOL],
      tool_choice: { type: "tool", name: SCORING_TOOL.name },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    const verdicts = toolUse?.input?.results;

    // Un verdict manquant ou en trop fausserait le score : on refuse plutôt
    // que de renvoyer une note calculée sur une liste incomplète (NFR4).
    if (!Array.isArray(verdicts) || verdicts.length !== criteria.length) {
      return Response.json(
        { error: "L'IA n'a pas rendu un verdict par critère." },
        { status: 500 }
      );
    }

    // Le libellé affiché reste celui saisi par l'utilisateur : on se fie à
    // l'ordre, pas au texte que le modèle a pu reformuler en le recopiant.
    const results = criteria.map((criterion, index) => ({
      criterion,
      passed: verdicts[index].passed === true,
      explanation:
        typeof verdicts[index].explanation === "string"
          ? verdicts[index].explanation
          : "",
    }));

    return Response.json({ results });
  } catch (error) {
    let error_message = "Erreur lors de la notation par l'IA.";

    if (error instanceof Anthropic.AuthenticationError) {
      error_message = "Clé API Anthropic invalide.";
    } else if (error instanceof Anthropic.RateLimitError) {
      error_message = "Trop d'appels à l'IA, réessayez dans un instant.";
    } else if (error instanceof Anthropic.APIError) {
      error_message = `Erreur de l'API Anthropic (${error.status}).`;
    }

    console.error("[/api/score]", error);
    return Response.json({ error: error_message }, { status: 500 });
  }
}
