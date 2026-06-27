#!/usr/bin/env python3
"""Ingest radeonrun results/strix into the website dataset (radeonrun is authoritative).

Radeon Arena is a performance leaderboard whose numbers must be reproducible from
a pinned build. The radeonrun toolkit (../radeonrun) measures each recipe on real
gfx1151 with a *pinned* engine image (recipes/*.yaml `image_tag`), so its results
are the source of truth for the models it covers.

This script, for every radeonrun recipe that has a result, emits runs.json rows
carrying the pinned image provenance (image / image_tag / image_commit) and the
reproducible decode / TTFT / TPOT measurements. Those rows OVERRIDE the daily
InferStation-fleet rows (host `ryzen-ai-max-395-03`) for the same
(model, quant, engine); the long-context regression suite
(`amd-rocm-regression`), the R9700 rows, and fleet models radeonrun does not
cover are left untouched.

Note: radeonrun's halo-arena-v1 profile measures decode throughput (+ TTFT/TPOT)
but not cold prefill throughput, so the generated rows intentionally carry no
`pp_toks_per_s`; the prefill (pp512) board therefore only retains fleet/regression
models. Decode (tokens/sec) — the headline metric — becomes fully reproducible.

Usage:
  python3 scripts/ingest-results.py            # dry run (prints the diff)
  python3 scripts/ingest-results.py --write    # apply to src/data/runs.json
Then regenerate the snapshot:  pnpm snapshot
"""
import datetime
import glob
import hashlib
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.exit("pyyaml is required: pip install pyyaml")

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
RR = os.environ.get("RADEONRUN_DIR", os.path.join(os.path.dirname(WEB), "radeonrun"))
RUNS_JSON = os.path.join(WEB, "src", "data", "runs.json")
DAILY_FLEET_HOST = "ryzen-ai-max-395-03"
RADEONRUN_HOST = "radeonrun-strix-halo"  # synthetic host slug for radeonrun-backed rows

# logical engine -> ghcr image-name component (matches build.sh / run-recipe.py)
ENGINE_IMAGE = {"llamacpp": "halo-llamacpp", "vllm": "halo-vllm", "vllm-main": "halo-vllm-main"}
# logical engine -> (display name, engine.slug, backend, build_flags)
ENGINE_META = {
    "llamacpp": ("llama.cpp", "llamacpp-hip", "ROCm/HIP", "-DGGML_HIP=ON (gfx1151)"),
    "vllm": ("vLLM", "vllm", "ROCm/HIP \u00b7 TRITON_ATTN", None),
    "vllm-main": ("vLLM", "vllm", "ROCm/HIP \u00b7 TRITON_ATTN", None),
}


def norm_model(s: str) -> str:
    return re.sub(r"-+", "-", (s or "").lower().replace(".", "-").replace("_", "-")).strip("-")


def norm_quant(s: str) -> str:
    return (s or "").upper().replace("_", "-")


def logical_engine(container: str) -> str:
    c = (container or "").lower()
    if "vllm-main" in c:
        return "vllm-main"
    if "vllm" in c:
        return "vllm"
    return "llamacpp"


def match_engine(engine_name: str) -> str:
    """Coarse engine bucket used to match against fleet rows (vLLM-main folds into vLLM)."""
    return "llamacpp" if "llama" in (engine_name or "").lower() else "vllm"


def model_from_stem(stem: str, quant: str) -> str:
    """Recipe filename `<model>-<quant>-<engine>` -> base model token (robust vs gguf paths)."""
    m = stem
    for suf in ("-llamacpp", "-vllm-main", "-vllm"):
        if m.endswith(suf):
            m = m[: -len(suf)]
            break
    qfn = (quant or "").lower().replace("_", "-")
    if qfn and m.endswith("-" + qfn):
        m = m[: -len("-" + qfn)]
    return m


def model_display(rec: dict, quant: str, fallback: str) -> str:
    """Clean human-readable model name. Prefer the recipe description
    ("... serving <Name> (<quant>) ..."), which has consistent casing and no
    quant/format echo; fall back to the HF source repo basename."""
    for desc in (rec.get("description"), (rec.get("metadata") or {}).get("description")):
        if desc:
            m = re.search(r"serving\s+(.+?)\s*\(", desc)
            if m:
                return m.group(1).strip()
    base = (rec.get("source") or "").split("/")[-1]
    base = re.sub(r"-(GGUF|gguf)(?=-|$)", "", base)
    if quant:
        qpat = re.escape(quant).replace(r"\-", "[-_]").replace(r"\_", "[-_]")
        base = re.sub(rf"[-_]{qpat}$", "", base, flags=re.I)
    return base or fallback


def hash_id(*parts: str) -> str:
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:10]


def build_rows():
    new_rows = []
    override_keys = set()  # (norm_model, norm_quant, match_engine)
    skipped = []
    for f in sorted(glob.glob(os.path.join(RR, "recipes", "*.yaml"))):
        rec = yaml.safe_load(open(f))
        stem = os.path.basename(f)[:-5]
        res_path = os.path.join(RR, "results", "strix", f"{stem}.json")
        if not os.path.exists(res_path):
            skipped.append(stem)
            continue
        res = json.load(open(res_path))
        eng = logical_engine(rec.get("container"))
        quant = (rec.get("metadata") or {}).get("quantization") or ""
        mslug = norm_model(model_from_stem(stem, quant))
        disp = model_display(rec, quant, model_from_stem(stem, quant))
        bucket = match_engine(ENGINE_META[eng][0])
        override_keys.add((mslug, norm_quant(quant), bucket))

        tag = rec.get("image_tag") or "latest"
        image = f"ghcr.io/radeon-arena/{ENGINE_IMAGE[eng]}:{tag}"
        meta = res.get("meta") or {}
        image_commit = meta.get("image_commit") or tag
        image_id = meta.get("image_id")
        name_disp, eslug, backend, bflags = ENGINE_META[eng]
        src_url = ("https://huggingface.co/" + rec["source"]) if rec.get("source") else None
        run_date = (res.get("generated_at") or "2026-06-27")[:10]
        command = " ".join((meta.get("command") or "").split())

        for m in res.get("measurements", []):
            c = m.get("concurrency", 1)
            tg = m.get("tg", 128)
            decode = m.get("decode_toks_per_s")
            if decode is None:
                continue
            row = {
                "schema_version": 0,
                "run_date": run_date,
                "host": {
                    "slug": RADEONRUN_HOST,
                    "name": "Strix Halo",
                    "vendor": "AMD",
                    "chip": "Strix Halo / Radeon 8060S (gfx1151)",
                    "vram_gb": 128,
                    "deployment_form": "apu_minipc",
                },
                "model": {"slug": mslug, "name": disp, "params_b": None,
                          "quantization": quant, "source_url": src_url},
                "engine": {"slug": eslug, "name": name_disp, "version": tag,
                           "commit": image_commit, "backend": backend, "build_flags": bflags},
                "command": command,
                # radeonrun measures decode only — no cold prefill throughput
                "tg_test": f"out{tg}",
                "tg_toks_per_s": decode,
                "ttft_ms": m.get("ttft_ms"),
                "tpot_ms": m.get("tpot_ms"),
                "concurrency": c,
                "scenario": "serve-stream-in512-out128",
                "image": image,
                "image_tag": tag,
                "image_commit": image_commit,
                "id": hash_id("radeonrun", stem, str(c)),
                "source_url": src_url,
            }
            if image_id:
                row["image_id"] = image_id
            new_rows.append(row)
    return new_rows, override_keys, skipped


def main():
    web = json.load(open(RUNS_JSON))
    fleet = web["runs"]
    new_rows, override_keys, skipped = build_rows()

    kept, dropped, refreshed = [], 0, 0
    for r in fleet:
        # Idempotent: drop rows from a previous ingest so re-running just
        # regenerates them with the latest results.
        if r["host"]["slug"] == RADEONRUN_HOST:
            refreshed += 1
            continue
        if r["host"]["slug"] == DAILY_FLEET_HOST:
            k = (norm_model(r["model"]["slug"]), norm_quant(r["model"]["quantization"]),
                 match_engine(r["engine"]["name"]))
            if k in override_keys:
                dropped += 1
                continue
        kept.append(r)

    merged = kept + new_rows
    print(f"radeonrun configs ingested : {len(override_keys)}  (rows generated: {len(new_rows)})")
    if skipped:
        print(f"recipes without a result   : {skipped}")
    if refreshed:
        print(f"prior radeonrun rows dropped: {refreshed} (idempotent re-ingest)")
    print(f"daily-fleet rows overridden : {dropped}")
    print(f"fleet/regression rows kept  : {len(kept)}")
    print(f"merged total rows           : {len(merged)} (was {len(fleet)})")

    if "--write" in sys.argv:
        web["runs"] = merged
        web["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        src = web.get("source", "")
        if "radeonrun" not in src:
            web["source"] = (src + " + radeonrun results/strix (authoritative)").strip(" +")
        with open(RUNS_JSON, "w") as fh:
            json.dump(web, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print("WROTE", RUNS_JSON)
    else:
        print("(dry run — pass --write to apply, then run `pnpm snapshot`)")


if __name__ == "__main__":
    main()
