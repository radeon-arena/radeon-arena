"use client";

import { useEffect, useState } from "react";
import type { CarouselItem } from "@/lib/types";

export function Carousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/static/carousel", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data && Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-ink-800 bg-ink-950/60 py-3">
      <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
        {loop.map((it, i) => (
          <div key={i} className="chip whitespace-nowrap gap-2 px-3 py-1">
            <span className="font-mono text-radeon-400">{it.tokensPerSec.toFixed(1)}</span>
            <span className="text-zinc-500">tok/s</span>
            <span className="text-zinc-300">{it.modelName}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">{it.runtime}</span>
            {it.clusterSize > 1 && <span className="text-zinc-600">·c{it.clusterSize}</span>}
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
