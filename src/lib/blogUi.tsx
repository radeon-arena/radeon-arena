import Link from "next/link";
import type { ReactNode } from "react";
import { CopyCode } from "../components/CopyCode";

/* Typography primitives: posts are written as JSX, no markdown dependency. */

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-lg leading-8 text-zinc-300">{children}</p>;
}
export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 border-t border-ink-800 pt-6 text-xl font-semibold tracking-tight text-zinc-100">
      {children}
    </h2>
  );
}
export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 text-base font-semibold text-zinc-100">{children}</h3>;
}
export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-7 text-zinc-300">{children}</p>;
}
export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-zinc-300 marker:text-zinc-500">
      {children}
    </ul>
  );
}
export function C({ children }: { children: ReactNode }) {
  return <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">{children}</code>;
}
export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-radeon-500 underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
export function Pre({ children }: { children: string }) {
  return (
    <div className="relative mt-4">
      <pre className="thin-scroll overflow-x-auto whitespace-pre rounded-lg border border-ink-700 bg-ink-850 p-4 pr-16 font-mono text-[13px] leading-6 text-zinc-200">
        <code>{children}</code>
      </pre>
      <CopyCode text={children} />
    </div>
  );
}
// Columns from `numericFrom` on are right-aligned; rows listed in `emphasis` are bold.
export function Table({ head, rows, numericFrom = 1, emphasis = [] }: { head: string[]; rows: ReactNode[][]; numericFrom?: number; emphasis?: number[] }) {
  return (
    <div className="thin-scroll mt-5 overflow-x-auto rounded-xl border border-ink-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-850 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={`whitespace-nowrap px-3 py-2.5 font-medium ${i >= numericFrom ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {rows.map((r, ri) => (
            <tr key={ri} className={emphasis.includes(ri) ? "bg-ink-850 font-semibold text-zinc-100" : "hover:bg-ink-850/60"}>
              {r.map((c, ci) => (
                <td key={ci} className={`whitespace-nowrap px-3 py-2.5 ${ci >= numericFrom ? "text-right tabular-nums" : ""} ${emphasis.includes(ri) ? "" : "text-zinc-300"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  content: ReactNode;
};
