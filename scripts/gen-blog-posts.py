#!/usr/bin/env python3
"""Generate src/lib/blogModels.tsx: one blog post per model and one per engine.

Every number in the generated posts comes from the radeonrun bundle passed on
the command line (the same file the site publishes as /data/bundle.json). The
hand-written parts below (model descriptions, notes, engine write-ups) must not
add numbers that are not in the bundle.

    python3 scripts/gen-blog-posts.py public/data/bundle.json > src/lib/blogModels.tsx
"""
import collections
import json
import re
import sys

POST_DATE = "2026-11-26"

DEVICES = ["r9700", "strix", "w7900"]  # site tab order
DEV = {"strix": "Strix Halo", "r9700": "R9700", "w7900": "W7900"}
DEV_LONG = {"strix": "Strix Halo (Radeon 8060S)", "r9700": "Radeon AI PRO R9700", "w7900": "Radeon PRO W7900"}
ENG = {"llamacpp": "llama.cpp", "vllm": "vLLM", "vllm-main": "vLLM (main)"}
FULL = ("BF16", "F16")

# slug, display name, regex on model id + source, one-line description (no numbers beyond the name)
MODELS = [
    ("qwen3-4b", "Qwen3-4B", r"qwen3-4b", "a dense 4B model from Qwen's Qwen3 family"),
    ("qwen3-8b", "Qwen3-8B", r"qwen3-8b", "a dense 8B model from Qwen's Qwen3 family"),
    ("qwen3-14b", "Qwen3-14B", r"qwen3-14b", "a dense 14B model from Qwen's Qwen3 family"),
    ("qwen3-32b", "Qwen3-32B", r"qwen3-32b", "the largest dense model from Qwen's Qwen3 family on the board"),
    ("qwen3-30b-a3b", "Qwen3-30B-A3B", r"qwen3-30b-a3b", "a mixture-of-experts model from Qwen's Qwen3 family with 30B total and about 3B active parameters"),
    ("qwen3.6-27b", "Qwen3.6-27B", r"qwen3\.6-27b", "a dense 27B model from Qwen3.6"),
    ("qwen3.6-35b-a3b", "Qwen3.6-35B-A3B", r"qwen3\.6-35b-a3b", "a mixture-of-experts model from Qwen3.6 with 35B total and about 3B active parameters"),
    ("qwen3.8-27b", "Qwen3.8-27B", r"qwen3\.8-27b", "a dense 27B model from Qwen3.8"),
    ("qwen3.8-flash-next", "Qwen3.8-Flash-Next", r"qwen3\.8-flash-next", "a large mixture-of-experts model from Qwen3.8"),
    ("diffusiongemma-26b-a4b", "DiffusionGemma-26B-A4B", r"diffusiongemma", "Google's diffusion language model built on the Gemma 4 26B-A4B mixture-of-experts architecture"),
    ("gemma-4-26b-a4b", "Gemma-4-26B-A4B", r"gemma-4-26b", "Google's Gemma 4 mixture-of-experts model with 26B total and about 4B active parameters"),
    ("gemma-4-31b", "Gemma-4-31B", r"gemma-4-31b", "Google's dense 31B Gemma 4 model"),
    ("llama-3.1-8b", "Llama-3.1-8B-Instruct", r"llama-3\.1-8b", "Meta's dense 8B instruction model"),
    ("granite-4.2-8b", "Granite 4.2 8B", r"granite-4\.2-8b", "IBM's 8B Granite 4.2 model"),
    ("granite-4.2-30b", "Granite 4.2 30B", r"granite-4\.2-30b", "IBM's 30B Granite 4.2 model"),
    ("lfm2.5-24b-a2b", "LFM2.5-24B-A2B", r"lfm2\.5-24b", "Liquid AI's mixture-of-experts model with 24B total and about 2B active parameters"),
    ("lfm3-1.7b", "LFM3-1.7B", r"lfm3-1\.7b", "Liquid AI's 1.7B model"),
    ("ling-3.0-flash", "Ling-3.0-flash", r"ling-3\.0-flash", "inclusionAI's larger Ling 3.0 model"),
    ("ling-3.0-tiny", "Ling-3.0-tiny", r"ling-3\.0-tiny", "inclusionAI's small Ling 3.0 model"),
    ("mimo-v2.6-distill-qwen-9b", "MiMo-V2.6-Distill-Qwen-9B", r"mimo-v2\.6-distill", "Xiaomi's MiMo V2.6 distilled into a 9B Qwen model"),
    ("mimo-v2.6-flash", "MiMo-V2.6-Flash", r"mimo-v2\.6-flash", "Xiaomi's large MiMo V2.6 Flash model"),
    ("mimo-v2.5", "MiMo-V2.5", r"mimo-v2\.5", "Xiaomi's large MiMo V2.5 model"),
    ("nemotron-3.5-bolt-e4b", "Nemotron 3.5 Bolt E4B", r"nemotron-3\.5-bolt-e4b", "NVIDIA's small Nemotron 3.5 Bolt model"),
    ("nemotron-3.5-bolt-74b-a9b", "Nemotron 3.5 Bolt 74B-A9B", r"nemotron-3\.5-bolt-74b", "NVIDIA's mixture-of-experts Nemotron 3.5 Bolt model with 74B total and about 9B active parameters"),
    ("nemotron-3.5-lightning-30b-a3b", "Nemotron 3.5 Lightning 30B-A3B", r"nemotron-3\.5-lightning", "NVIDIA's mixture-of-experts Nemotron 3.5 Lightning model with 30B total and about 3B active parameters"),
    ("nemotron-3.5-super-vl-120b-a12b", "Nemotron 3.5 Super VL 120B-A12B", r"nemotron-3\.5-super", "NVIDIA's vision-language Nemotron 3.5 Super model with 120B total and about 12B active parameters"),
    ("minicpm-v-4.7-1b", "MiniCPM-V 4.7 1B", r"minicpm-v-4\.7-1b", "OpenBMB's 1B vision-language model"),
    ("minicpm-v-4.7-35b-a3b", "MiniCPM-V 4.7 35B-A3B", r"minicpm-v-4\.7-35b", "OpenBMB's mixture-of-experts vision-language model with 35B total and about 3B active parameters"),
    ("minicpm5-2b", "MiniCPM5-2B", r"minicpm5-2b", "OpenBMB's 2B MiniCPM5 model"),
    ("step-3.5-flash", "Step-3.5-Flash", r"step-3\.5-flash", "StepFun's large Step 3.5 Flash model"),
    ("deepseek-v4-flash", "DeepSeek-V4-Flash-0731", r"deepseek-v4-flash", "DeepSeek's large V4 Flash model, 0731 release"),
    ("glm-5.3-flash", "GLM-5.3-Flash", r"glm-5\.3-flash", "Z.ai's large GLM 5.3 Flash model"),
]

# Extra hand-written observations. Numbers here were copied from the bundle and
# are checked against it by check_notes() below.
NOTES = {
    "qwen3-4b": [
        "R9700 is the only device with a vLLM run for this model. At 32 requests it reached 1,639 tok/s in total on one card, against 565 for llama.cpp with Q4_K_M on the same card, while llama.cpp Q4_K_M was faster for a single request (123.8 against 70.3 tok/s).",
    ],
    "qwen3-30b-a3b": [
        "The BF16+YaRN rows run the same weights with YaRN rope scaling switched on for long context. The test prompt is only 512 tokens, so they show what the setting costs at short context: on W7900 with vLLM on two cards, 69.0 against 75.5 tok/s for one request and 308 against 498 tok/s at 32 requests.",
    ],
    "qwen3.6-27b": [
        "Quark W8A8-INT8 in vLLM was not a shortcut on R9700: on two cards it gave 11.8 tok/s for one request against 20.8 for BF16 on two cards. On Strix Halo it did beat BF16 for one request, 7.8 against 4.3 tok/s.",
    ],
    "qwen3.6-35b-a3b": [
        "This model has the most variants on the board: BF16, Q8_0 and UD-Q4_K_M in llama.cpp, and BF16, AWQ-4bit, Quark W8A8-INT8 and Intel's INT4 AutoRound in vLLM. The AWQ and Quark weights are third-party quantizations.",
        "On Strix Halo the fastest vLLM format was INT4 AutoRound, at 37.8 tok/s for one request and 189 at 32, but llama.cpp with UD-Q4_K_M was faster for a single request, at 49.3 tok/s.",
    ],
    "qwen3.8-flash-next": [
        "Only low-bit UD builds were measured. On R9700 and W7900 they are spread over four cards; Strix Halo runs them on its single integrated GPU.",
    ],
    "diffusiongemma-26b-a4b": [
        "DiffusionGemma refines a block of tokens at a time instead of emitting one token after another, so the first streamed token arrives late: 6.3 seconds after the request on W7900. It runs on vLLM's main branch.",
        "Total throughput hardly grows beyond 4 concurrent requests. The W7900 server was started with at most 4 sequences.",
    ],
    "gemma-4-31b": [
        "Only the Quark W8A8-INT8 build was measured, in vLLM.",
    ],
    "mimo-v2.6-flash": [
        "Only a 2-bit IQ2_XS_M build was measured, spread over four cards. The first token of a 512-token prompt took 2.7 seconds on W7900 and 5.1 seconds on R9700.",
    ],
    "deepseek-v4-flash": [
        "Only the 2-bit UD-Q2_K_XL build was measured. R9700 and W7900 spread it over four cards; Strix Halo runs it on its single integrated GPU.",
    ],
    "glm-5.3-flash": [
        "Only a 2-bit UD-IQ2_XXS build was measured, on four cards. It was not measured on Strix Halo.",
    ],
}


def gpu_count(r):
    t = (r.get("launch") or {}).get("topology") or {}
    n = t.get("gpu_count") or t.get("tensor_parallel_size")
    if not n:
        n = ((r.get("device") or {}).get("topology") or {}).get("default_gpu_count") or 1
    return int(n)


def load(path):
    bundle = json.load(open(path))
    rows = []
    for dev, recs in bundle["records"].items():
        for r in recs:
            key = (r["model"].get("id") or r["recipe"]["name"]).lower() + " " + (r["model"].get("source") or "").lower()
            m = next((m for m in MODELS if re.search(m[2], key)), None)
            if not m:
                raise SystemExit(f"no model group for {key}")
            pts = {p["concurrency"]: p for p in r["data"].get("measurements", []) if p.get("depth", 0) == 0}
            meth = (r["data"].get("methodology") or {}).get("version")
            rows.append(dict(
                slug=m[0], dev=dev, gpus=gpu_count(r), engine=ENG.get(r["launch"]["runtime"], r["launch"]["runtime"]),
                quant=r["model"].get("quantization") or "", source=r["model"].get("source") or "",
                c1=pts.get(1, {}).get("decode_toks_per_s"), c32=pts.get(32, {}).get("decode_toks_per_s"),
                curve={c: p["decode_toks_per_s"] for c, p in sorted(pts.items())},
                ttft=pts.get(1, {}).get("ttft_ms") if meth == 2 else None,
                month=r["data"].get("generated_at", "")[:7],
            ))
    return bundle, rows


def f1(v):
    return f"{v:,.1f}"


def f0(v):
    return f"{v:,.0f}"


def cfg(x, with_dev=True):
    g = f", {x['gpus']} GPUs" if x["gpus"] > 1 else ""
    d = f" on {DEV[x['dev']]}" if with_dev else ""
    return f"{x['quant']} in {x['engine']}{d}{g}"


def month(m):
    return {"2026-07": "Jul 2026", "2026-11": "Nov 2026"}.get(m, m)


def sort_key(x):
    return (DEVICES.index(x["dev"]), x["engine"], x["gpus"], x["quant"])


def js(s):
    return json.dumps(s, ensure_ascii=False)


def text(s):
    return "{" + js(s) + "}"


def auto_points(xs):
    pts = []
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    # fastest single request per device
    best = []
    for d in devs:
        b = max((x for x in xs if x["dev"] == d and x["c1"]), key=lambda x: x["c1"])
        best.append(f"{DEV[d]} {f1(b['c1'])} tok/s ({cfg(b, False)})")
    pts.append("Fastest single request on each device: " + "; ".join(best) + ".")
    # highest total throughput
    b = max((x for x in xs if x["c32"]), key=lambda x: x["c32"])
    if len(xs) > 1:
        pts.append(f"Highest total throughput at 32 concurrent requests: {f0(b['c32'])} tok/s with {cfg(b)}.")
    # quantization effect in llama.cpp, same device and GPU count
    def same_gpus_first(d):
        ll = [x for x in xs if x["dev"] == d and x["engine"] == "llama.cpp"]
        return 0 if any(a["gpus"] == b["gpus"] for a in ll if a["quant"] in FULL for b in ll if re.search(r"Q4|Q3", b["quant"])) else 1
    for d in sorted(devs, key=same_gpus_first):
        ll = [x for x in xs if x["dev"] == d and x["engine"] == "llama.cpp"]
        full = [x for x in ll if x["quant"] in FULL]
        q4 = [x for x in ll if re.search(r"Q4|Q3", x["quant"])]
        if full and q4:
            a, q = full[0], max(q4, key=lambda x: x["c1"])
            same = a["gpus"] == q["gpus"]
            gp = "" if same else f" ({a['quant']} on {a['gpus']} GPUs, {q['quant']} on {q['gpus']})"
            pts.append(
                f"Quantization in llama.cpp on {DEV[d]}: {q['quant']} decodes a single request {q['c1']/a['c1']:.1f}x as fast as {a['quant']}, "
                f"{f1(q['c1'])} against {f1(a['c1'])} tok/s{gp}."
            )
            break
    # same weights and GPU count, both engines
    by = collections.defaultdict(dict)
    for x in xs:
        by[(x["dev"], x["quant"], x["gpus"])][x["engine"]] = x
    for (d, q, g), e in sorted(by.items(), key=lambda kv: DEVICES.index(kv[0][0])):
        if "vLLM" in e and "llama.cpp" in e:
            v, l = e["vLLM"], e["llama.cpp"]
            gp = f" on {g} GPUs" if g > 1 else ""
            pts.append(
                f"Same {q} weights on {DEV[d]}{gp}: vLLM {f1(v['c1'])} tok/s for one request and {f0(v['c32'])} at 32; "
                f"llama.cpp {f1(l['c1'])} and {f0(l['c32'])}."
            )
    # throughput that falls off at 32
    for x in sorted(xs, key=sort_key):
        if not x["curve"] or not x["c32"]:
            continue
        peak_c, peak = max(x["curve"].items(), key=lambda kv: kv[1])
        if peak_c < 32 and x["c32"] < 0.85 * peak:
            pts.append(
                f"With {cfg(x)}, total throughput peaked at {f0(peak)} tok/s with {peak_c} requests and fell to {f0(x['c32'])} at 32."
            )
    return pts


METHOD = [
    "How we measure: llama-benchy sends streaming requests with a 512-token prompt and 128 generated tokens to the server's OpenAI-compatible endpoint, at 1, 4, 16 and 32 concurrent requests. Each point is the median of three runs after a warm-up. Prompts are text only.",
    "\u201c1 request\u201d is the decode speed one user sees. \u201c32 requests\u201d is the combined decode rate of all 32. TTFT is the time to the first token for a single request. Strix Halo runs from July 2026 used an earlier version of the harness, whose prompts could partly hit the prefix cache, so their TTFT is not shown.",
    "R9700 numbers are the best of the runs we made with the same image and command. All numbers are on the leaderboard, and every row's engine image and full command are on the device's Recipes page.",
]


def table(xs):
    best = {}
    for x in xs:
        if x["c1"] and (x["dev"] not in best or x["c1"] > best[x["dev"]]["c1"]):
            best[x["dev"]] = x
    rows, emph = [], []
    for i, x in enumerate(sorted(xs, key=sort_key)):
        if best.get(x["dev"]) is x:
            emph.append(i)
        rows.append([DEV[x["dev"]], x["engine"], x["quant"], str(x["gpus"]),
                     f1(x["c1"]) if x["c1"] else "\u2014", f0(x["c32"]) if x["c32"] else "\u2014",
                     f0(x["ttft"]) if x["ttft"] else "\u2014", month(x["month"])])
    head = ["Device", "Engine", "Weights", "GPUs", "1 req tok/s", "32 req tok/s", "TTFT ms", "Date"]
    body = ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in rows)
    return (f"      <Table\n        head={{{js(head)}}}\n        numericFrom={{3}}\n        emphasis={{{js(emph)}}}\n"
            f"        rows={{[\n{body},\n        ]}}\n      />")


def ul(items):
    return "      <UL>\n" + "".join(f"        <li>{text(s)}</li>\n" for s in items) + "      </UL>"


def recipe_links(devs):
    parts = []
    for i, d in enumerate(devs):
        sep = "" if i == 0 else (" and " if i == len(devs) - 1 else ", ")
        parts.append(f'{text(sep) if sep else ""}<A href="/{d}/recipes">{DEV[d]}</A>')
    return "".join(parts)


def model_post(m, xs, rows_all):
    slug, name, _, desc = m
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    engines = sorted({x["engine"] for x in xs})
    quants = sorted({x["quant"] for x in xs})
    lead = (f"{name} is {desc}. We measured {len(xs)} deployment{'s' if len(xs) > 1 else ''} of it on "
            f"{', '.join(DEV_LONG[d] for d in devs[:-1]) + ' and ' if len(devs) > 1 else ''}{DEV_LONG[devs[-1]]}, "
            f"with {' and '.join(engines)} and {len(quants)} weight format{'s' if len(quants) > 1 else ''}. This post puts them side by side.")
    b = max((x for x in xs if x["c1"]), key=lambda x: x["c1"])
    excerpt = (f"{len(xs)} measured deployment{'s' if len(xs) > 1 else ''} of {name} across "
               f"{', '.join(DEV[d] for d in devs)}. Fastest single request: {f1(b['c1'])} tok/s with {cfg(b)}.")
    sources = sorted({x["source"] for x in xs if x["source"]})
    tags = ["Model", name] + [DEV[d] for d in devs] + engines
    out = [f"  {{\n    slug: {js('model-' + slug)},\n    title: {js(name + ' on AMD Radeon: every deployment we measured')},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: 3,\n    tags: {js(tags)},\n    excerpt: {js(excerpt)},",
           "    content: (\n      <>",
           f"      <Lead>{text(lead)}</Lead>",
           "      <H2>All deployments</H2>",
           f"      <P>{text('Bold rows are the fastest single-request setup on each device. GPUs is the number of cards the server used; req means concurrent requests.')}</P>",
           table(xs),
           "      <H2>What the numbers say</H2>",
           ul(auto_points(xs) + NOTES.get(slug, [])),
           "      <H2>Weights</H2>",
           ul([f"{s}" for s in sources]),
           "      <H2>Method and recipes</H2>",
           *[f"      <P>{text(p)}</P>" for p in METHOD],
           f"      <P>{text('Recipes: ')}{recipe_links(devs)}{text('. Leaderboard: ')}<A href=\"/{devs[0]}/leaderboard\">{text(DEV[devs[0]])}</A>{text('.')}</P>",
           "      </>\n    ),\n  },"]
    return "\n".join(out)


ENGINE_INTRO = {
    "vllm": [
        "vLLM runs on all three devices on the board. We use it for BF16 weights and for the quantized formats it supports on ROCm: AWQ, AMD Quark W8A8-INT8 and Intel AutoRound INT4. DiffusionGemma needs vLLM's main branch and is listed separately as vLLM (main).",
        "Every result is tied to a pinned image, never a moving tag; the image and full serve command for each row are on the device's Recipes page. On R9700 the servers use --attention-backend TRITON_ATTN.",
    ],
    "llamacpp": [
        "llama.cpp with the ROCm/HIP backend runs every GGUF result on the board, on all three devices. A typical server here is llama-server -ngl 999 -fa on -c 32768 -np 32: all layers on the GPU, flash attention on, 32 parallel slots sharing a 32K context. Multi-GPU runs split the layers across cards. On Strix Halo the largest models load with --no-mmap or --load-mode none, as their recipes show.",
        "Every result is tied to a pinned image, never a moving tag. The Strix Halo models measured in July used an older llama.cpp build than the models added in November, so compare across those two groups with care. Each row's image and command are on the device's Recipes page.",
    ],
}
ENGINE_NOTES = {
    "vllm": [
        "vLLM's advantage is concurrency. In every pairing below with the same weights, device and card count, vLLM delivered more total throughput at 32 requests than llama.cpp, often several times more.",
        "For a single request the picture is mixed: on Strix Halo, llama.cpp was faster for Qwen3.6-35B-A3B in BF16 (22.0 against 17.1 tok/s), and on W7900 two-card BF16 it was faster for Qwen3.6-27B (11.9 against 7.2).",
        "Quantized vLLM formats did not always help on a single request. On R9700, Quark W8A8-INT8 for Qwen3.6-27B on two cards gave 11.8 tok/s against 20.8 for BF16 on two cards.",
    ],
    "llamacpp": [
        "llama.cpp is the simplest way to fit a model: GGUF quantizations from 2-bit to BF16 all run with the same server, and the 100 GB-class models on the board only run here.",
        "Single-request speed follows the size of the weights, so quantization pays off directly. The table below shows the single-request decode rate of BF16 (or F16), Q8_0 and the 4-bit build for models that have all three on one card.",
        "Total throughput at 32 requests grows less than with vLLM, and in some setups it falls after a peak at 4 or 16 requests; the model posts list those cases.",
    ],
}


def engine_post(key, rows_all):
    name = {"vllm": "vLLM", "llamacpp": "llama.cpp"}[key]
    engines = ["vLLM", "vLLM (main)"] if key == "vllm" else ["llama.cpp"]
    xs = [x for x in rows_all if x["engine"] in engines]
    models = {x["slug"]: x for x in xs}
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    counts = "; ".join(f"{DEV[d]} {sum(1 for x in xs if x['dev'] == d)}" for d in devs)
    mname = {m[0]: m[1] for m in MODELS}
    excerpt = f"All {len(xs)} {name} results on the board, {len(models)} models across {', '.join(DEV[d] for d in devs)}: what runs, how fast, and where {name} wins or loses."
    lead = f"{len(xs)} of the board's results run on {name}, covering {len(models)} models (results per device: {counts}). This post collects them in one place."
    out = [f"  {{\n    slug: {js('engine-' + ('vllm' if key == 'vllm' else 'llama-cpp'))},\n    title: {js(name + ' on AMD Radeon: all our results in one place')},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: 5,\n    tags: {js(['Engine', name] + [DEV[d] for d in devs])},\n    excerpt: {js(excerpt)},",
           "    content: (\n      <>",
           f"      <Lead>{text(lead)}</Lead>",
           "      <H2>How we run it</H2>",
           *[f"      <P>{text(p)}</P>" for p in ENGINE_INTRO[key]],
           "      <H2>What we see</H2>",
           ul(ENGINE_NOTES[key])]
    # vLLM vs llama.cpp pairs
    if key == "vllm":
        by = collections.defaultdict(dict)
        for x in rows_all:
            by[(x["slug"], x["dev"], x["quant"], x["gpus"])][x["engine"]] = x
        pairs = []
        for (s, d, q, g), e in by.items():
            if "vLLM" in e and "llama.cpp" in e:
                v, l = e["vLLM"], e["llama.cpp"]
                pairs.append([mname[s], DEV[d], q, str(g), f1(v["c1"]), f1(l["c1"]), f0(v["c32"]), f0(l["c32"])])
        pairs.sort(key=lambda r: (r[0], r[1]))
        out += ["      <H2>vLLM against llama.cpp, same weights and cards</H2>",
                f"      <P>{text('Decode tok/s for one request and total tok/s at 32 concurrent requests.')}</P>",
                "      <Table\n        head={" + js(["Model", "Device", "Weights", "GPUs", "vLLM 1 req", "llama.cpp 1 req", "vLLM 32 req", "llama.cpp 32 req"]) + "}\n        numericFrom={3}\n        rows={[\n"
                + ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in pairs) + ",\n        ]}\n      />"]
    else:
        qrows = []
        for s in [m[0] for m in MODELS]:
            for d in DEVICES:
                ll = [x for x in xs if x["slug"] == s and x["dev"] == d and x["gpus"] == 1]
                full = next((x for x in ll if x["quant"] in FULL), None)
                q8 = next((x for x in ll if x["quant"] == "Q8_0"), None)
                q4 = max((x for x in ll if re.search(r"Q4", x["quant"])), key=lambda x: x["c1"], default=None)
                if full and q8 and q4:
                    qrows.append([mname[s], DEV[d], f1(full["c1"]), f1(q8["c1"]), f1(q4["c1"]), q4["quant"], f"{q4['c1']/full['c1']:.1f}x"])
        out += ["      <H2>Quantization on one card</H2>",
                f"      <P>{text('Single-request decode tok/s. The last column is the 4-bit build against BF16 or F16.')}</P>",
                "      <Table\n        head={" + js(["Model", "Device", "BF16/F16", "Q8_0", "4-bit", "4-bit format", "4-bit vs 16-bit"]) + "}\n        numericFrom={2}\n        rows={[\n"
                + ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in qrows) + ",\n        ]}\n      />"]
    # all results
    rows = []
    for x in sorted(xs, key=lambda x: (mname[x["slug"]], DEVICES.index(x["dev"]), x["gpus"], x["quant"])):
        rows.append([mname[x["slug"]], DEV[x["dev"]], x["quant"], str(x["gpus"]), f1(x["c1"]) if x["c1"] else "\u2014", f0(x["c32"]) if x["c32"] else "\u2014"])
    out += [f"      <H2>Every {name} result</H2>",
            f"      <P>{text('Each model has its own post with all of its deployments on every engine.')}</P>",
            "      <Table\n        head={" + js(["Model", "Device", "Weights", "GPUs", "1 req tok/s", "32 req tok/s"]) + "}\n        numericFrom={3}\n        rows={[\n"
            + ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in rows) + ",\n        ]}\n      />",
            "      <H2>Model posts</H2>",
            "      <UL>\n" + "".join(f'        <li><A href="/blogs/model-{s}">{text(mname[s])}</A></li>\n' for s in [m[0] for m in MODELS] if s in models) + "      </UL>",
            "      <H2>Method</H2>",
            *[f"      <P>{text(p)}</P>" for p in METHOD],
            "      </>\n    ),\n  },"]
    return "\n".join(out)


def check_notes(rows_all):
    """Every number written by hand in NOTES/ENGINE_NOTES must appear in the bundle (rounded)."""
    vals = set()
    for x in rows_all:
        for v in list(x["curve"].values()) + [x["ttft"] or 0]:
            vals |= {f"{v:.1f}", f"{v:,.0f}", f"{v:.0f}", f"{v/1000:.1f}"}
    allowed = {"1", "2", "4", "8", "16", "32", "512", "100", "0", "3", "5"}
    bad = []
    texts = [t for ts in NOTES.values() for t in ts] + [t for ts in ENGINE_NOTES.values() for t in ts]
    for t in texts:
        for n in re.findall(r"(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?", t):
            if n not in vals and n not in allowed:
                bad.append((n, t[:80]))
    if bad:
        raise SystemExit("numbers not found in bundle: " + repr(bad))


def main():
    bundle, rows_all = load(sys.argv[1])
    check_notes(rows_all)
    by = collections.defaultdict(list)
    for x in rows_all:
        by[x["slug"]].append(x)
    print("// Generated by scripts/gen-blog-posts.py from radeonrun bundle "
          f"{bundle.get('short_commit')} ({bundle.get('generated_at', '')[:10]}). Do not edit by hand.")
    print('import { A, H2, Lead, P, Table, UL, type BlogPost } from "./blogUi";\n')
    print("export const ENGINE_POSTS: BlogPost[] = [")
    print(engine_post("vllm", rows_all))
    print(engine_post("llamacpp", rows_all))
    print("];\n")
    print("export const MODEL_POSTS: BlogPost[] = [")
    for m in MODELS:
        print(model_post(m, by[m[0]], rows_all))
    print("];")


if __name__ == "__main__":
    main()
