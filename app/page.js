"use client";

import { useState, useMemo } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState("");

  const criteriaCount = useMemo(
    () => criteria.split("\n").filter((line) => line.trim().length > 0).length,
    [criteria]
  );

  const canEvaluate = prompt.trim().length > 0 && criteriaCount > 0;

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

          <div>
            <button
              type="button"
              disabled={!canEvaluate}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:shadow-none"
            >
              Évaluer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
