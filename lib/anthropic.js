import Anthropic from "@anthropic-ai/sdk";

// Ce module n'est importé que depuis des routes API (contexte serveur, AD-1).
// Il existe pour qu'un seul endroit porte le modèle, le plafond de tokens et
// le mappage des erreurs : /api/execute, /api/score et bientôt /api/analyze
// les partagent, plutôt que d'en garder chacune sa copie qui dérivera.

export const MODEL = "claude-haiku-4-5";

// Plafond volontairement modeste pour tenir le budget du POC (NFR2).
export const MAX_TOKENS = 4096;

// Forme d'erreur unique sur toutes les routes (AD-2) : { error } + HTTP 500.
export function errorResponse(message) {
  return Response.json({ error: message }, { status: 500 });
}

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Traduit une erreur du SDK en message affichable. On teste les classes
// typées du SDK, jamais le texte du message.
export function describeAnthropicError(error, fallback) {
  if (error instanceof Anthropic.AuthenticationError) {
    return "Clé API Anthropic invalide.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Trop d'appels à l'IA, réessayez dans un instant.";
  }
  if (error instanceof Anthropic.APIError) {
    return `Erreur de l'API Anthropic (${error.status}).`;
  }
  return fallback;
}
