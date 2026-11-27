"use client";

import { useState } from "react";
import { useLang } from "./LangProvider";

/* Copy button shown in the top-right corner of blog code blocks. */
export function CopyCode({ text }: { text: string }) {
  const lang = useLang();
  const [done, setDone] = useState(false);
  const zh = lang === "zh";
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="absolute right-2 top-2 rounded-md border border-ink-700 bg-ink-800 px-2 py-1 text-xs text-zinc-400 opacity-80 transition hover:text-zinc-100 hover:opacity-100 focus-visible:opacity-100"
      aria-label={zh ? "复制代码" : "Copy code"}
    >
      {done ? (zh ? "已复制" : "Copied") : zh ? "复制" : "Copy"}
    </button>
  );
}
