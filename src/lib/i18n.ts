// Two site languages. English lives at the root (/docs), Chinese under /zh
// (/zh/docs). Pages pass `lang` down; client components read it from
// LangProvider via useLang().

export type Lang = "en" | "zh";

export const LANGS: Lang[] = ["en", "zh"];

export const HTML_LANG: Record<Lang, string> = { en: "en", zh: "zh-CN" };

/** Site path in the given language. `path` is the English path, starting with "/". */
export function lp(lang: Lang, path: string): string {
  if (lang === "en") return path;
  return path === "/" ? "/zh/" : `/zh${path}`;
}

/** Strip the /zh prefix to get the English path of any page. */
export function enPath(pathname: string): string {
  if (pathname === "/zh" || pathname === "/zh/") return "/";
  return pathname.startsWith("/zh/") ? pathname.slice(3) : pathname;
}

/**
 * canonical + hreflang for page metadata. Only blog posts use this: Next adds
 * a trailing slash to these URLs, which matches how posts have always been
 * served. Every other public page (/, /docs, /blogs, the device tabs, the
 * policies, and their /zh twins) gets canonical and hreflang from nginx Link
 * headers without a trailing slash, so it must not declare its own here.
 */
export function alternates(lang: Lang, path: string) {
  if (!path.startsWith("/blogs/")) return undefined;
  return {
    canonical: lp(lang, path),
    languages: { en: path, "zh-CN": lp("zh", path), "x-default": path },
  };
}

/** Pick the string for the current language. */
export function t<T>(lang: Lang, en: T, zh: T): T {
  return lang === "zh" ? zh : en;
}
