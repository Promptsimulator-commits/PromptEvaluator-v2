"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const MIN_RUNS = 1;
const MAX_RUNS = 10;
const DEFAULT_RUNS = 5;

// Renvoie toujours la même forme, que l'appel ait échoué côté serveur
// (HTTP 500 + { error }) ou côté réseau (fetch qui lève), pour que l'appelant
// traite l'échec de la même manière dans les deux cas.
async function callApi(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: { error: "impossible de joindre le serveur" } };
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [runCount, setRunCount] = useState(DEFAULT_RUNS);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [extractedCriteria, setExtractedCriteria] = useState(null);
  // Copie modifiable de extractedCriteria (référence distincte) : l'édition
  // en place, l'ajout et la suppression de lignes ne touchent que cet état.
  const [criteriaList, setCriteriaList] = useState([]);
  // true une fois "Confirmer et lancer" cliqué : la liste devient lecture
  // seule jusqu'au prochain "Envoyer" (nouvelle extraction).
  const [isConfirmed, setIsConfirmed] = useState(false);
  // Génération des N réponses (Story 1.4).
  const [isGenerating, setIsGenerating] = useState(false);
  const [runs, setRuns] = useState([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [generationError, setGenerationError] = useState(null);

  const shouldFocusNewRow = useRef(false);
  const criterionInputRefs = useRef([]);

  useEffect(() => {
    if (shouldFocusNewRow.current) {
      shouldFocusNewRow.current = false;
      const lastInput = criterionInputRefs.current[criteriaList.length - 1];
      lastInput?.focus();
    }
  }, [criteriaList]);

  const canSend = prompt.trim().length > 0 && !isExtracting;

  // Contexte neuf à chaque appel (AD-3) : aucun historique n'est envoyé, la
  // route /api/extract-criteria ne connaît que le prompt de cet appel.
  async function handleSend() {
    // Garde de ré-entrance : un double-clic avant que React ne committe
    // disabled={isExtracting} ne doit pas lancer deux appels concurrents.
    if (isExtracting) return;
    setIsExtracting(true);
    setExtractionError(null);
    setExtractedCriteria(null);
    setCriteriaList([]);
    setIsConfirmed(false);

    const { ok, data } = await callApi("/api/extract-criteria", { prompt });

    if (!ok || !Array.isArray(data?.criteria) || data.criteria.length === 0) {
      setExtractionError(
        data?.error ?? "Erreur inattendue lors de l'extraction des critères."
      );
      setIsExtracting(false);
      return;
    }

    setExtractedCriteria(data.criteria);
    setCriteriaList([...data.criteria]);
    setIsExtracting(false);
  }

  function handleEditCriterion(index, value) {
    setCriteriaList((list) =>
      list.map((criterion, i) => (i === index ? value : criterion))
    );
  }

  function handleRemoveCriterion(index) {
    setCriteriaList((list) => list.filter((_, i) => i !== index));
  }

  function handleAddCriterion() {
    shouldFocusNewRow.current = true;
    setCriteriaList((list) => [...list, ""]);
  }

  const hasBlankCriterion = criteriaList.some(
    (criterion) => criterion.trim().length === 0
  );

  // Boucle séquentielle sur /api/execute (FR3, FR3b) : N est figé dès l'entrée
  // dans la fonction (valeur de runCount au moment du clic), donc un
  // déplacement ultérieur du curseur n'a aucun effet sur cette génération.
  // Un seul échec abandonne tout le flux (NFR4) : aucune réponse partielle
  // n'est conservée comme résultat final.
  async function handleConfirm() {
    if (criteriaList.length === 0 || hasBlankCriterion) return;
    // Garde de ré-entrance : le bouton disparaît une fois isConfirmed à true,
    // mais on se protège quand même d'un second déclenchement concurrent.
    if (isGenerating) return;

    setIsConfirmed(true);
    setGenerationError(null);
    setRuns([]);

    const n = runCount;
    setTotalRuns(n);
    setIsGenerating(true);

    for (let i = 0; i < n; i++) {
      // Contexte neuf à chaque appel (AD-3) : pas d'historique partagé entre
      // les exécutions, chaque appel repart uniquement du prompt d'origine.
      const { ok, data } = await callApi("/api/execute", { prompt });

      if (!ok || typeof data?.output !== "string" || data.output.length === 0) {
        const reason =
          data?.error ?? "Erreur inattendue lors de l'appel à l'IA.";
        setGenerationError(
          `Échec de l'exécution ${i + 1}/${n} : ${reason}`
        );
        setRuns([]);
        setIsGenerating(false);
        return;
      }

      setRuns((prev) => [...prev, data.output]);
    }

    setIsGenerating(false);
  }

  // Referme la liste et restaure l'état de saisie initial : le prompt reste
  // inchangé, aucune requête réseau n'est déclenchée.
  function handleCancel() {
    setExtractedCriteria(null);
    setCriteriaList([]);
    setIsConfirmed(false);
    setExtractionError(null);
    setIsGenerating(false);
    setRuns([]);
    setTotalRuns(0);
    setGenerationError(null);
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 py-16 px-6 sm:px-10">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Prompt Evaluator
            </h1>
            <p className="font-display text-xs font-bold tracking-widest text-primary uppercase">
              Teste ton prompt
            </p>
            <p className="text-sm text-foreground/70">
              Rédige un prompt : on en extrait automatiquement les critères qu&apos;un bon résultat devrait respecter.
            </p>
          </div>
          <Image
            src="/getsitelogo.png"
            alt="Logo de l'entreprise"
            width={40}
            height={40}
            className="shrink-0"
          />
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="prompt"
              className="font-display text-sm font-medium text-foreground"
            >
              Prompt à évaluer
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isExtracting}
              rows={8}
              placeholder="Saisis le prompt que tu souhaites tester"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="runCount"
                className="font-display text-sm font-medium text-foreground"
              >
                Nombre d&apos;exécutions
              </label>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {runCount} exécution{runCount !== 1 ? "s" : ""}
              </span>
            </div>
            <input
              id="runCount"
              type="range"
              min={MIN_RUNS}
              max={MAX_RUNS}
              step={1}
              value={runCount}
              disabled={isExtracting || isGenerating}
              onChange={(e) => setRunCount(Number(e.target.value))}
              className="w-full accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            />
            <div className="flex justify-between font-mono text-xs text-foreground/40">
              <span>{MIN_RUNS}</span>
              <span>{MAX_RUNS}</span>
            </div>
            <p className="text-sm text-foreground/70">
              {runCount === 1
                ? "Une seule exécution : tu verras un résultat, mais pas la stabilité du prompt."
                : `Le prompt sera exécuté ${runCount} fois. Plus il y a d'exécutions, plus la mesure de fiabilité est précise, mais chaque exécution a un coût — 5 est un bon compromis pour un premier test.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:shadow-none"
            >
              {isExtracting ? "Extraction en cours…" : "Envoyer"}
            </button>
            {isExtracting && (
              <span
                aria-live="polite"
                className="font-mono text-xs text-foreground/60"
              >
                extraction des critères…
              </span>
            )}
          </div>
        </div>

        {extractionError && (
          <div
            role="alert"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
          >
            {extractionError}
          </div>
        )}

        {extractedCriteria && (
          <section
            aria-labelledby="criteria-heading"
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="criteria-heading"
                className="font-display text-2xl font-semibold tracking-tight text-foreground"
              >
                Critères extraits
              </h2>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {criteriaList.length} critère
                {criteriaList.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {criteriaList.map((criterion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <input
                    type="text"
                    value={criterion}
                    disabled={isConfirmed}
                    ref={(el) => {
                      criterionInputRefs.current[index] = el;
                    }}
                    onChange={(e) =>
                      handleEditCriterion(index, e.target.value)
                    }
                    aria-label={`Critère ${index + 1}`}
                    className="flex-1 border-none bg-transparent text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  {!isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(index)}
                      aria-label="Supprimer ce critère"
                      className="text-foreground/40 transition-colors hover:text-primary"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {!isConfirmed && (
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="rounded-xl border border-dashed border-border px-3 py-2 text-left text-sm text-foreground/60 transition-colors hover:border-primary hover:text-primary"
                >
                  + Ajouter un critère
                </button>
              )}
            </div>

            {isConfirmed ? (
              <>
                {isGenerating && (
                  <p
                    aria-live="polite"
                    className="font-mono text-xs text-foreground/60"
                  >
                    exécution {runs.length + 1}/{totalRuns}
                  </p>
                )}
                {!isGenerating && !generationError && runs.length > 0 && (
                  <p
                    aria-live="polite"
                    className="font-mono text-xs text-foreground/60"
                  >
                    Liste confirmée — {totalRuns} exécution
                    {totalRuns > 1 ? "s" : ""} terminée
                    {totalRuns > 1 ? "s" : ""}.
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={criteriaList.length === 0 || hasBlankCriterion}
                  className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-foreground/15 disabled:text-foreground/40"
                >
                  Confirmer et lancer
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full px-4 py-3 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary"
                >
                  Annuler
                </button>
              </div>
            )}
          </section>
        )}

        {generationError && (
          <div
            role="alert"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
          >
            {generationError}
          </div>
        )}

        {isConfirmed && !generationError && runs.length > 0 && (
          <section
            aria-labelledby="runs-heading"
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="runs-heading"
                className="font-display text-2xl font-semibold tracking-tight text-foreground"
              >
                Réponses générées
              </h2>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {runs.length}/{totalRuns}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {runs.map((output, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="mb-2 font-mono text-xs font-medium text-foreground/50">
                    Exécution {index + 1}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {output}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
