"use client";

import { useState, useMemo } from "react";

const MIN_RUNS = 1;
const MAX_RUNS = 10;
const DEFAULT_RUNS = 5;

// Renvoie toujours la même forme, que l'appel ait échoué côté serveur
// (HTTP 500 + { error }) ou côté réseau (fetch qui lève), pour que les deux
// phases d'orchestration traitent l'échec de la même manière.
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

function formatScore(score) {
  return score.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState("");
  const [runCount, setRunCount] = useState(DEFAULT_RUNS);
  // Nombre d'exécutions figé au lancement de l'évaluation en cours : distinct de
  // runCount, que l'utilisateur peut rebouger après coup sans fausser l'affichage.
  const [totalRuns, setTotalRuns] = useState(DEFAULT_RUNS);
  const [runs, setRuns] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const criteriaList = useMemo(
    () =>
      criteria
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [criteria]
  );

  const criteriaCount = criteriaList.length;
  const canEvaluate = prompt.trim().length > 0 && criteriaCount > 0 && !isRunning;
  const scoredCount = runs.filter((run) => run.results !== null).length;

  // Orchestration côté client (AD-4), en deux phases successives : d'abord les
  // N exécutions, puis les N notations. Si un seul appel échoue, à l'une ou
  // l'autre phase, toute l'évaluation est abandonnée — aucun résultat partiel
  // n'est conservé à l'écran.
  async function handleEvaluate() {
    setIsRunning(true);
    setError(null);
    setRuns([]);

    // Figé au lancement : déplacer le curseur pendant une évaluation ne doit
    // pas changer le nombre d'exécutions en cours de route.
    const total = runCount;
    setTotalRuns(total);

    const abandon = (message) => {
      setRuns([]);
      setError(
        `${message} Évaluation abandonnée, aucun résultat partiel n'est retenu.`
      );
      setIsRunning(false);
    };

    const collected = [];

    // Phase 1 — exécuter le prompt N fois (FR3).
    for (let i = 0; i < total; i++) {
      const { ok, data } = await callApi("/api/execute", { prompt });

      if (!ok || typeof data?.output !== "string") {
        abandon(
          `Exécution ${i + 1}/${total} : ${data?.error ?? "erreur inattendue"}.`
        );
        return;
      }

      collected.push({ output: data.output, results: null, score: null });
      setRuns([...collected]);
    }

    // Phase 2 — noter chacun des N résultats selon les critères (FR4, FR5).
    for (let i = 0; i < total; i++) {
      const { ok, data } = await callApi("/api/score", {
        output: collected[i].output,
        criteria: criteriaList,
      });

      const results = data?.results;

      if (!ok || !Array.isArray(results) || results.length === 0) {
        abandon(
          `Notation ${i + 1}/${total} : ${data?.error ?? "erreur inattendue"}.`
        );
        return;
      }

      const passedCount = results.filter((result) => result.passed).length;

      collected[i] = {
        ...collected[i],
        results,
        score: (passedCount / results.length) * 10,
      };
      setRuns([...collected]);
    }

    setIsRunning(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 py-16 px-6 sm:px-10">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Prompt Evaluator
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Testez votre prompt
          </h1>
          <p className="text-sm text-foreground/60">
            Écrivez un prompt et ce qu&apos;un bon résultat doit respecter — l&apos;IA se charge du reste.
          </p>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="prompt"
              className="text-sm font-medium text-foreground"
            >
              Prompt à évaluer
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="Saisissez le prompt que vous souhaitez tester…"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="criteria"
                className="text-sm font-medium text-foreground"
              >
                Critères d&apos;acceptation (un par ligne)
              </label>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {criteriaCount} critère{criteriaCount !== 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              id="criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              rows={8}
              placeholder={
                "Un critère par ligne…\nex : La réponse doit être en français\nex : La réponse fait moins de 5 lignes"
              }
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="runCount"
                className="text-sm font-medium text-foreground"
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
              disabled={isRunning}
              onChange={(e) => setRunCount(Number(e.target.value))}
              className="w-full accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            />
            <div className="flex justify-between font-mono text-xs text-foreground/40">
              <span>{MIN_RUNS}</span>
              <span>{MAX_RUNS}</span>
            </div>
            <p className="text-xs text-foreground/60">
              {runCount === 1
                ? "Une seule exécution : vous verrez un résultat, mais pas la stabilité du prompt."
                : `Le prompt sera exécuté ${runCount} fois pour révéler les variations d'une exécution à l'autre.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!canEvaluate}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:shadow-none"
            >
              {isRunning ? "Évaluation en cours…" : "Évaluer"}
            </button>
            {isRunning && (
              <span className="font-mono text-xs text-foreground/60">
                {runs.length < totalRuns
                  ? `exécution ${runs.length + 1} / ${totalRuns}`
                  : `notation ${Math.min(scoredCount + 1, totalRuns)} / ${totalRuns}`}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
          >
            {error}
          </div>
        )}

        {runs.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Résultats
              </h2>
              <span className="font-mono text-xs text-foreground/60">
                {runs.length} / {totalRuns}
              </span>
            </div>

            {runs.map((run, index) => (
              <article
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                    Exécution {index + 1}
                  </span>
                  {run.score !== null && (
                    <span className="font-mono text-sm font-semibold text-primary">
                      {formatScore(run.score)} / 10
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {run.output}
                </p>

                {run.results && (
                  <ul className="flex flex-col gap-2 border-t border-border pt-3">
                    {run.results.map((result, resultIndex) => (
                      <li key={resultIndex} className="flex gap-2.5 text-sm">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 font-mono font-semibold ${
                            result.passed ? "text-primary" : "text-foreground/30"
                          }`}
                        >
                          {result.passed ? "✓" : "✗"}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={
                              result.passed
                                ? "text-foreground"
                                : "text-foreground/50"
                            }
                          >
                            <span className="sr-only">
                              {result.passed ? "Validé : " : "Non validé : "}
                            </span>
                            {result.criterion}
                          </span>
                          <span className="text-xs text-foreground/60">
                            {result.explanation}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
