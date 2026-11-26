import Link from "next/link";
import { HARDWARE, DEFAULT_HW } from "@/lib/hardware";
import { lp, type Lang } from "@/lib/i18n";
import { HeaderNav } from "@/components/HeaderNav";
import { LangSwitch } from "@/components/LangSwitch";

export function Header({ lang }: { lang: Lang }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const hardware = HARDWARE.map((h) => ({
    key: h.key,
    short: h.short,
    label: h.label,
    disabled: Boolean(h.disabled),
  }));

  // One row on wide screens (logo · nav · hardware · language). Below `lg` the
  // nav and hardware tabs move to a second, horizontally scrollable row.
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 px-4 sm:px-6 lg:flex-nowrap lg:gap-x-4">
        <Link href={lp(lang, "/")} aria-label="Radeon Arena" className="order-1 flex h-14 shrink-0 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${basePath}/icon.svg`} alt="" width={20} height={20} />
            </span>
            <span className="hidden font-semibold tracking-tight text-zinc-50 min-[480px]:inline">
              Radeon<span className="text-radeon-500">Arena</span>
            </span>
        </Link>

        <div className="order-2 ml-auto flex h-14 items-center lg:order-4 lg:ml-0">
          <LangSwitch lang={lang} />
        </div>

        <HeaderNav lang={lang} hardware={hardware} defaultHw={DEFAULT_HW} />
      </div>
    </header>
  );
}
