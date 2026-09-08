"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

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

// "absent" < "présent" < "clair" (le meilleur statut) — voir SYSTEM_PROMPT de
// /api/analyze pour la définition exacte de chaque statut.
const STATUS_LABEL = { absent: "Absent", présent: "À clarifier", clair: "Clair" };

// Couleur par statut, sur les tokens déjà en place (pas de couleur en dur) :
// primary = acquis, accent = à travailler, foreground atténué = manquant.
const STATUS_CLASS = {
  clair: "bg-primary/10 text-primary",
  présent: "bg-accent/15 text-accent",
  absent: "bg-foreground/10 text-foreground/50",
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState("");
  const [runCount, setRunCount] = useState(DEFAULT_RUNS);
  // Nombre d'exécutions figé au lancement de l'évaluation en cours : distinct de
  // runCount, que l'utilisateur peut rebouger après coup sans fausser l'affichage.
  const [totalRuns, setTotalRuns] = useState(DEFAULT_RUNS);
  // Liste des critères figée au lancement, pour la même raison : si l'utilisateur
  // retape le champ critères après une évaluation terminée, le résumé affiché
  // continue de correspondre à ce qui a été réellement mesuré.
  const [evaluatedCriteria, setEvaluatedCriteria] = useState([]);
  // Prompt figé au lancement de l'évaluation, pour la même raison que
  // evaluatedCriteria : si l'utilisateur retape le prompt après une évaluation
  // terminée sans relancer, ses résultats ne doivent plus être envoyés comme
  // s'ils portaient sur le texte actuel (Story 2.2 — l'analyse enrichie ne
  // doit jamais mélanger les résultats d'un prompt avec l'énoncé d'un autre).
  const [evaluatedPrompt, setEvaluatedPrompt] = useState(null);
  const [runs, setRuns] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  // Distinct de "les résultats existent" : passe à true seulement quand les N
  // exécutions ET les N notations ont réussi, jamais après un abandon — le
  // résumé (moyenne, stabilité) ne doit s'afficher que sur une mesure complète.
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  // Prompt figé au lancement de l'analyse en cours : permet de signaler que
  // l'analyse affichée ne porte plus sur le texte actuel du champ, sans
  // pour autant l'effacer (l'utilisateur peut vouloir comparer avant/après).
  const [analyzedPrompt, setAnalyzedPrompt] = useState(null);

  // Les doublons sont retirés : deux lignes identiques compteraient deux fois
  // dans la note (FR5) et se télescoperaient dans le regroupement par critère
  // de la Story 1.5. On conserve l'ordre de première apparition.
  const criteriaList = useMemo(
    () => [
      ...new Set(
        criteria
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      ),
    ],
    [criteria]
  );

  const criteriaCount = criteriaList.length;
  // "Analyser" et "Évaluer" sont mutuellement exclusifs (décision de revue du
  // spec 2.1) : un seul enchaînement d'appels IA en vol à la fois.
  const canEvaluate =
    prompt.trim().length > 0 && criteriaCount > 0 && !isRunning && !isAnalyzing;
  const canAnalyze = prompt.trim().length > 0 && !isRunning && !isAnalyzing;
  const scoredCount = runs.filter((run) => run.results !== null).length;

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    const promptSnapshot = prompt;
    // N'enrichit qu'avec une évaluation complète (isComplete) ET dont le
    // prompt figé au lancement correspond exactement au texte actuel : sans
    // cette deuxième condition, éditer le prompt après une évaluation terminée
    // sans relancer enverrait les résultats d'un autre prompt (Blind Hunter,
    // Story 2.2 review) — même principe que isAnalysisStale, appliqué ici en
    // amont pour ne jamais construire la requête erronée plutôt que d'afficher
    // une analyse incohérente après coup. Données brutes uniquement
    // (`criterion`/`passed`) : c'est la route qui détermine elle-même les
    // critères instables (contrat fixé en Story 2.1).
    const runResults =
      isComplete && promptSnapshot === evaluatedPrompt
        ? runs.map((run) =>
            run.results.map((result) => ({
              criterion: result.criterion,
              passed: result.passed,
            }))
          )
        : undefined;

    const { ok, data } = await callApi("/api/analyze", {
      prompt: promptSnapshot,
      ...(runResults ? { runResults } : {}),
    });

    if (!ok || !Array.isArray(data?.dimensions)) {
      setAnalysisError(data?.error ?? "Erreur inattendue lors de l'analyse.");
      setIsAnalyzing(false);
      return;
    }

    setAnalyzedPrompt(promptSnapshot);
    setAnalysis(data.dimensions);
    setIsAnalyzing(false);
  }

  const isAnalysisStale = analysis !== null && prompt !== analyzedPrompt;

  // Orchestration côté client (AD-4), en deux phases successives : d'abord les
  // N exécutions, puis les N notations. Si un seul appel échoue, à l'une ou
  // l'autre phase, toute l'évaluation est abandonnée — aucun résultat partiel
  // n'est conservé à l'écran.
  async function handleEvaluate() {
    setIsRunning(true);
    setIsComplete(false);
    setError(null);
    setRuns([]);

    // Figés au lancement : déplacer le curseur ou retaper les critères pendant
    // une évaluation ne doit rien changer à l'évaluation en cours ni à son résumé.
    const total = runCount;
    setTotalRuns(total);
    const criteriaSnapshot = criteriaList;
    setEvaluatedCriteria(criteriaSnapshot);
    setEvaluatedPrompt(prompt);

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

      if (!ok || typeof data?.output !== "string" || data.output.trim() === "") {
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
        criteria: criteriaSnapshot,
      });

      const results = data?.results;

      // Le dénominateur du score est le nombre de critères saisis (FR5), pas
      // le nombre de verdicts reçus : on refuse une réponse dont la taille ne
      // correspond pas, plutôt que d'afficher une note plausible mais fausse.
      if (!ok || !Array.isArray(results) || results.length !== criteriaSnapshot.length) {
        abandon(
          `Notation ${i + 1}/${total} : ${data?.error ?? "erreur inattendue"}.`
        );
        return;
      }

      const passedCount = results.filter((result) => result.passed).length;

      collected[i] = {
        ...collected[i],
        results,
        score: (passedCount / criteriaSnapshot.length) * 10,
      };
      setRuns([...collected]);
    }

    setIsRunning(false);
    setIsComplete(true);
  }

  // Moyenne des N scores (FR6) — n'a de sens qu'une fois l'évaluation complète.
  // Diviser par totalRuns (figé), pas runs.length : la garantie que les deux
  // coïncident ne doit pas reposer implicitement sur la logique de isComplete
  // (même classe de défaut que le dénominateur du score, corrigé en Story 1.4).
  const averageScore = isComplete
    ? runs.reduce((sum, run) => sum + run.score, 0) / totalRuns
    : null;

  // Pour chaque critère, combien de fois sur N il a été validé (FR7). On
  // s'appuie sur la position plutôt que sur le texte : la route renvoie
  // toujours le libellé exact saisi par l'utilisateur, dans l'ordre des
  // critères envoyés, donc l'index est une clé fiable pour regrouper à
  // travers les N exécutions. `?.` par précaution : sans effet aujourd'hui
  // (isComplete garantit des résultats complets), mais évite qu'une future
  // dérive fasse planter le rendu plutôt que d'afficher un résultat dégradé.
  const criterionStability = isComplete
    ? evaluatedCriteria.map((criterion, index) => ({
        criterion,
        passedCount: runs.filter((run) => run.results[index]?.passed).length,
      }))
    : [];

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
              Rédige un prompt et les critères qu&apos;un bon résultat doit respecter. On l&apos;exécute plusieurs fois pour vérifier sa fiabilité.
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
              disabled={isRunning}
              rows={8}
              placeholder="Saisis le prompt que tu souhaites tester"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="criteria"
                className="font-display text-sm font-medium text-foreground"
              >
                Critères d&apos;acceptation (un par ligne)
              </label>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {criteriaCount} critère{criteriaCount > 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              id="criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              disabled={isRunning}
              rows={8}
              placeholder={
                "Un critère par ligne\nex : La réponse doit être en français\nex : La réponse fait moins de 5 lignes"
              }
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
              disabled={isRunning}
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
              onClick={handleEvaluate}
              disabled={!canEvaluate}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:shadow-none"
            >
              {isRunning ? "Évaluation en cours…" : "Évaluer"}
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-foreground/15 disabled:text-foreground/40 disabled:shadow-none"
            >
              {isAnalyzing ? "Analyse en cours…" : "Analyser"}
            </button>
            {isRunning && (
              <span
                aria-live="polite"
                className="font-mono text-xs text-foreground/60"
              >
                {runs.length < totalRuns
                  ? `exécution ${runs.length + 1} / ${totalRuns}`
                  : `notation ${Math.min(scoredCount + 1, totalRuns)} / ${totalRuns}`}
              </span>
            )}
            {isAnalyzing && (
              <span
                aria-live="polite"
                className="font-mono text-xs text-foreground/60"
              >
                analyse en cours…
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/70">
            <strong className="font-medium text-foreground">Évaluer</strong> exécute et note ton prompt plusieurs fois pour mesurer sa fiabilité.
            <br />
            <strong className="font-medium text-foreground">Analyser</strong> donne un diagnostic de sa structure (persona, objectif, contraintes, exemples), avec ou sans évaluation préalable.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
          >
            {error}
          </div>
        )}

        {analysisError && (
          <div
            role="alert"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
          >
            {analysisError}
          </div>
        )}

        {analysis && (
          <section
            aria-labelledby="analysis-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="analysis-heading"
                className="font-display text-2xl font-semibold tracking-tight text-foreground"
              >
                Analyse du prompt
              </h2>
              {isAnalysisStale && (
                <span className="text-xs text-foreground/60">
                  Prompt modifié depuis cette analyse
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {analysis.map((dimension) => (
                <article
                  key={dimension.name}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize text-foreground">
                      {dimension.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${STATUS_CLASS[dimension.status] ?? "bg-foreground/10 text-foreground/50"}`}
                    >
                      {STATUS_LABEL[dimension.status] ?? dimension.status}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {dimension.explanation}
                  </p>
                  <p className="border-t border-border pt-2 text-xs leading-relaxed text-foreground/60">
                    <span className="font-medium text-foreground/70">
                      Exemple :{" "}
                    </span>
                    {dimension.example}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {isComplete && (
          <section
            aria-labelledby="summary-heading"
            role="status"
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <h2 id="summary-heading" className="sr-only">
              Synthèse de l&apos;évaluation
            </h2>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                Note finale
              </span>
              <span className="font-display text-5xl font-semibold text-foreground">
                {formatScore(averageScore)}
                <span className="text-2xl text-foreground/40"> / 10</span>
              </span>
              <span className="text-xs text-foreground/60">
                Moyenne sur {totalRuns} exécution{totalRuns !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground">
                Stabilité par critère
              </h3>
              {totalRuns === 1 && (
                <p className="text-xs text-foreground/60">
                  Une seule exécution : ce ratio ne mesure pas encore la stabilité de ton prompt.
                </p>
              )}
              <ul className="flex flex-col gap-2">
                {criterionStability.map(({ criterion, passedCount }, index) => (
                  <li key={index} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{criterion}</span>
                      <span className="shrink-0 font-mono text-xs font-medium text-accent">
                        {passedCount} / {totalRuns}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(passedCount / totalRuns) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
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
