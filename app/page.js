"use client";

import { useState, useMemo } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState("");

  const hasNonBlankCriteria = useMemo(
    () => criteria.split("\n").some((line) => line.trim().length > 0),
    [criteria]
  );

  const canEvaluate = prompt.trim().length > 0 && hasNonBlankCriteria;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-16 px-6 sm:px-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Évaluateur de prompt
        </h1>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="prompt"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Prompt à évaluer
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Saisissez le prompt que vous souhaitez tester…"
            className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-black focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="criteria"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Critères d&apos;acceptation (un par ligne)
          </label>
          <textarea
            id="criteria"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={8}
            placeholder={"Un critère par ligne…\nex : La réponse doit être en français"}
            className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-black focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <button
            type="button"
            disabled={!canEvaluate}
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-foreground dark:hover:bg-[#ccc]"
          >
            Évaluer
          </button>
        </div>
      </main>
    </div>
  );
}
