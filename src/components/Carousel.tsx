"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CarouselItem } from "@/lib/types";
import { loadGithubData } from "@/lib/githubData";

export function Carousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    let alive = true;
    loadGithubData()
      .then((data) => {
        if (alive) setItems(data.carousel.items);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;
  // Duplicate the list so the marquee can loop seamlessly.
  const loop = [...items, ...items];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Performance Highlights
        </h2>
        <Link href="/strix/leaderboard" className="text-sm text-radeon-400 hover:text-radeon-300">
          View full leaderboard →
        </Link>
      </div>

      {/* Auto-scrolling marquee of cards; pauses on hover. Edges fade out. */}
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
        <div className="flex w-max gap-4 py-1 animate-[marquee_80s_linear_infinite] group-hover:[animation-play-state:paused]">
          {loop.map((it, i) => (
            <div
              key={i}
              className="card flex min-w-[260px] max-w-[260px] shrink-0 flex-col gap-3 p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-zinc-500">{it.testName}</span>
                <span className="chip border-radeon-700/50 text-radeon-300">{it.runtime}</span>
              </div>

              <div>
                <p className="truncate font-semibold text-zinc-100" title={it.modelName}>
                  {it.modelName}
                </p>
                <p className="text-xs text-zinc-500">{it.org}</p>
              </div>

              <div className="mt-auto flex items-end justify-between gap-2">
                <div>
                  <p className="font-mono text-lg leading-none text-radeon-300">
                    {it.tokensPerSec.toFixed(1)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">tok/s decode</p>
                </div>
                <div className="text-right">
                  {it.gpu && <p className="text-xs text-zinc-400">{it.gpu}</p>}
                  {it.backend && <p className="text-xs text-zinc-600">{it.backend}</p>}
                </div>
              </div>

              <Link
                href="/strix/leaderboard"
                className="text-xs text-radeon-400 hover:text-radeon-300"
              >
                View on leaderboard →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}
