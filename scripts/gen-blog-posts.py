#!/usr/bin/env python3
"""Generate src/lib/blogModels.tsx: one blog post per model and one per engine,
in English (ENGINE_POSTS, MODEL_POSTS) and Chinese (ENGINE_POSTS_ZH, MODEL_POSTS_ZH).

Each post is a promotional tutorial: a hook, what to run on each card, the
exact download / docker run (or llama.cpp source build) / curl commands of one
measured row, the results table, tips and links. The per-model angle (title,
hook, the section that makes the post worth reading) lives in blog_stories.py.

Every number comes from the radeonrun bundle passed on the command line (the
same file the site publishes as /data/bundle.json); check_notes() rejects
hand-written numbers that are not measurements, same-model ratios or listed
facts, and check_pairs() makes the Chinese and English texts agree.
check-blog-downloads.py verifies on the Hub that every weight file exists.

    python3 scripts/gen-blog-posts.py public/data/bundle.json > src/lib/blogModels.tsx
"""
import collections
import json
import re
import shlex
import sys

POST_DATE = "2026-11-26"

DEVICES = ["r9700", "strix", "w7900"]  # site tab order
DEV = {"strix": "Strix Halo", "r9700": "R9700", "w7900": "W7900"}
DEV_LONG = {"strix": "Strix Halo (Radeon 8060S)", "r9700": "Radeon AI PRO R9700", "w7900": "Radeon PRO W7900"}
DEV_LONG_ZH = {"strix": "Radeon 8060S（Strix Halo）", "r9700": "Radeon AI PRO R9700", "w7900": "Radeon PRO W7900"}
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

# Chinese descriptions, same facts as the English ones above.
MODEL_ZH = {
    "qwen3-4b": "Qwen3 系列的 4B 稠密模型",
    "qwen3-8b": "Qwen3 系列的 8B 稠密模型",
    "qwen3-14b": "Qwen3 系列的 14B 稠密模型",
    "qwen3-32b": "榜单上 Qwen3 系列最大的稠密模型",
    "qwen3-30b-a3b": "Qwen3 系列的混合专家（MoE）模型，总参数 30B，激活约 3B",
    "qwen3.6-27b": "Qwen3.6 的 27B 稠密模型",
    "qwen3.6-35b-a3b": "Qwen3.6 的 MoE 模型，总参数 35B，激活约 3B",
    "qwen3.8-27b": "Qwen3.8 的 27B 稠密模型",
    "qwen3.8-flash-next": "Qwen3.8 的大型 MoE 模型",
    "diffusiongemma-26b-a4b": "Google 基于 Gemma 4 26B-A4B MoE 架构做的扩散语言模型",
    "gemma-4-26b-a4b": "Google Gemma 4 的 MoE 模型，总参数 26B，激活约 4B",
    "gemma-4-31b": "Google Gemma 4 的 31B 稠密模型",
    "llama-3.1-8b": "Meta 的 8B 稠密指令模型",
    "granite-4.2-8b": "IBM Granite 4.2 的 8B 模型",
    "granite-4.2-30b": "IBM Granite 4.2 的 30B 模型",
    "lfm2.5-24b-a2b": "Liquid AI 的 MoE 模型，总参数 24B，激活约 2B",
    "lfm3-1.7b": "Liquid AI 的 1.7B 模型",
    "ling-3.0-flash": "inclusionAI Ling 3.0 系列中较大的模型",
    "ling-3.0-tiny": "inclusionAI Ling 3.0 系列中的小模型",
    "mimo-v2.6-distill-qwen-9b": "小米把 MiMo V2.6 蒸馏到 9B Qwen 模型上得到的版本",
    "mimo-v2.6-flash": "小米 MiMo V2.6 系列的大型模型",
    "mimo-v2.5": "小米 MiMo V2.5 系列的大型模型",
    "nemotron-3.5-bolt-e4b": "NVIDIA Nemotron 3.5 Bolt 系列中的小模型",
    "nemotron-3.5-bolt-74b-a9b": "NVIDIA Nemotron 3.5 Bolt 的 MoE 模型，总参数 74B，激活约 9B",
    "nemotron-3.5-lightning-30b-a3b": "NVIDIA Nemotron 3.5 Lightning 的 MoE 模型，总参数 30B，激活约 3B",
    "nemotron-3.5-super-vl-120b-a12b": "NVIDIA Nemotron 3.5 Super 的视觉语言模型，总参数 120B，激活约 12B",
    "minicpm-v-4.7-1b": "OpenBMB 的 1B 视觉语言模型",
    "minicpm-v-4.7-35b-a3b": "OpenBMB 的 MoE 视觉语言模型，总参数 35B，激活约 3B",
    "minicpm5-2b": "OpenBMB MiniCPM5 系列的 2B 模型",
    "step-3.5-flash": "阶跃星辰 Step 3.5 系列的大型模型",
    "deepseek-v4-flash": "DeepSeek V4 系列的大型模型（0731 版）",
    "glm-5.3-flash": "智谱 Z.ai GLM 5.3 系列的大型模型",
}

sys.path.insert(0, __import__("os").path.dirname(__file__))
from blog_stories import ALLOWED_FACTS, STORIES  # noqa: E402

assert set(MODEL_ZH) == {m[0] for m in MODELS} == set(STORIES)


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
                rec=r,
            ))
    return bundle, rows


def f1(v):
    return f"{v:,.1f}"


def f0(v):
    return f"{v:,.0f}"


def cfg(x, with_dev=True, zh=False):
    if zh:
        parts = ([DEV[x["dev"]]] if with_dev else []) + [x["engine"], x["quant"]]
        if x["gpus"] > 1:
            parts.append(f"{x['gpus']} 卡")
        return "、".join(parts)
    g = f", {x['gpus']} GPUs" if x["gpus"] > 1 else ""
    d = f" on {DEV[x['dev']]}" if with_dev else ""
    return f"{x['quant']} in {x['engine']}{d}{g}"


def month(m, zh=False):
    if zh:
        return {"2026-07": "2026 年 7 月", "2026-11": "2026 年 11 月"}.get(m, m)
    return {"2026-07": "Jul 2026", "2026-11": "Nov 2026"}.get(m, m)


def sort_key(x):
    return (DEVICES.index(x["dev"]), x["engine"], x["gpus"], x["quant"])


def js(s):
    return json.dumps(s, ensure_ascii=False)


def text(s):
    return "{" + js(s) + "}"


def join_list(items, zh):
    """a, b and c / a、b 和 c"""
    if len(items) == 1:
        return items[0]
    if zh:
        return "、".join(items[:-1]) + " 和 " + items[-1]
    return ", ".join(items[:-1]) + " and " + items[-1]


def link(path, zh):
    path = path if path.endswith("/") else path + "/"  # canonical URLs end in a slash
    return ("/zh" + path) if zh else path


def auto_points(xs, zh=False):
    pts = []
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    # fastest single request per device
    best = []
    for d in devs:
        b = max((x for x in xs if x["dev"] == d and x["c1"]), key=lambda x: x["c1"])
        if zh:
            best.append(f"{DEV[d]} {f1(b['c1'])} tok/s（{cfg(b, False, True)}）")
        else:
            best.append(f"{DEV[d]} {f1(b['c1'])} tok/s ({cfg(b, False)})")
    if len(xs) == 1:
        x = xs[0]
        pts.append(f"单请求 {f1(x['c1'])} tok/s。" if zh else f"Single request: {f1(x['c1'])} tok/s.")
    else:
        pts.append(("各设备单请求最快：" + "；".join(best) + "。") if zh else ("Fastest single request on each device: " + "; ".join(best) + "."))
    # highest total throughput
    b = max((x for x in xs if x["c32"]), key=lambda x: x["c32"])
    if len(xs) > 1:
        pts.append(f"32 并发总吞吐最高：{f0(b['c32'])} tok/s（{cfg(b, True, True)}）。" if zh
                   else f"Highest total throughput at 32 concurrent requests: {f0(b['c32'])} tok/s with {cfg(b)}.")
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
            ratio = f"{q['c1']/a['c1']:.1f}"
            if zh:
                gp = "" if same else f"（{a['quant']} 用 {a['gpus']} 卡，{q['quant']} 用 {q['gpus']} 卡）"
                pts.append(f"{DEV[d]} 上 llama.cpp 的量化收益：{q['quant']} 的单请求解码速度是 {a['quant']} 的 {ratio} 倍，"
                           f"{f1(q['c1'])} 对 {f1(a['c1'])} tok/s{gp}。")
            else:
                gp = "" if same else f" ({a['quant']} on {a['gpus']} GPUs, {q['quant']} on {q['gpus']})"
                pts.append(
                    f"Quantization in llama.cpp on {DEV[d]}: {q['quant']} decodes a single request {ratio}x as fast as {a['quant']}, "
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
            if zh:
                loc = f"{DEV[d]} {g} 卡上" if g > 1 else f"{DEV[d]} 上"
                pts.append(f"{loc}同样的 {q} 权重：vLLM 单请求 {f1(v['c1'])} tok/s，32 并发 {f0(v['c32'])}；"
                           f"llama.cpp 分别是 {f1(l['c1'])} 和 {f0(l['c32'])}。")
            else:
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
            if zh:
                pts.append(f"配置（{cfg(x, True, True)}）的总吞吐在 {peak_c} 并发时达到峰值 {f0(peak)} tok/s，32 并发时反而降到 {f0(x['c32'])}。")
            else:
                pts.append(
                    f"With {cfg(x)}, total throughput peaked at {f0(peak)} tok/s with {peak_c} requests and fell to {f0(x['c32'])} at 32."
                )
    return pts


METHOD = [
    "How we measure: llama-benchy sends streaming requests with a 512-token prompt and 128 generated tokens to the server's OpenAI-compatible endpoint, at 1, 4, 16 and 32 concurrent requests. Each point is the median of three runs after a warm-up. Prompts are text only.",
    "\u201c1 request\u201d is the decode speed one user sees. \u201c32 requests\u201d is the combined decode rate of all 32. TTFT is the time to the first token for a single request. Some July 2026 runs (Strix Halo and part of R9700) used an earlier version of the harness, whose prompts could partly hit the prefix cache, so their TTFT is not shown.",
    "R9700 numbers are the best of the runs we made with the same image and command. All numbers are on the leaderboard, and every row's engine image and full command are on the device's Recipes page.",
]
METHOD_ZH = [
    "用 llama-benchy 向服务的 OpenAI 兼容接口发流式请求：提示词 512 个 token，生成 128 个 token，并发数分别为 1、4、16 和 32。每个测点先预热，再取三次运行的中位数。提示词均为纯文本。",
    "\u201c单请求\u201d是一个用户实际看到的解码速度；\u201c32 并发\u201d是 32 个请求合计的解码速度。TTFT 即首 token 时延，是单请求时等到第一个 token 的时间。2026 年 7 月的部分结果（Strix Halo 和一部分 R9700）用的是早期版本的测试工具，提示词可能部分命中前缀缓存，所以不列 TTFT。",
    "R9700 的数字取同一镜像、同一命令多次运行中最好的一次。所有数字都能在榜单上查到，每一行用的引擎镜像和完整命令都在对应设备的“部署配方”页上。",
]


def table(xs, zh=False):
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
                     f0(x["ttft"]) if x["ttft"] else "\u2014", month(x["month"], zh)])
    head = (["设备", "引擎", "权重格式", "卡数", "单请求 tok/s", "32 并发 tok/s", "TTFT ms", "测试时间"] if zh
            else ["Device", "Engine", "Weights", "GPUs", "1 req tok/s", "32 req tok/s", "TTFT ms", "Date"])
    body = ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in rows)
    return (f"      <Table\n        head={{{js(head)}}}\n        numericFrom={{3}}\n        emphasis={{{js(emph)}}}\n"
            f"        rows={{[\n{body},\n        ]}}\n      />")


def ul(items):
    return "      <UL>\n" + "".join(f"        <li>{text(s)}</li>\n" for s in items) + "      </UL>"


def recipe_links(devs, zh=False):
    parts = []
    for i, d in enumerate(devs):
        if i == 0:
            sep = ""
        elif i == len(devs) - 1:
            sep = " 和 " if zh else " and "
        else:
            sep = "、" if zh else ", "
        parts.append(f'{text(sep) if sep else ""}<A href="{link("/" + d + "/recipes", zh)}">{DEV[d]}</A>')
    return "".join(parts)


# ---------------------------------------------------------------- deployment commands

PUBLIC_IMAGE_PREFIXES = ("ghcr.io/inferstation/", "ghcr.io/radeon-arena/halo-")
LLAMA_REPO = "https://github.com/ggml-org/llama.cpp"
GFX = {"w7900": "gfx1100", "r9700": "gfx1201", "strix": "gfx1151"}


def find(xs, spec):
    dev, eng, quant, gpus = spec
    hit = [x for x in xs if (x["dev"], x["engine"], x["quant"], x["gpus"]) == spec]
    if len(hit) != 1:
        raise SystemExit(f"story config {spec} matches {len(hit)} rows")
    return hit[0]


def image_of(x):
    L = x["rec"]["launch"]
    img = L.get("image_resolved") or L.get("image") or ""
    return img if img.startswith(PUBLIC_IMAGE_PREFIXES) else None


def runnable(x):
    """Public image, or llama.cpp we can tell people to build from source."""
    return bool(image_of(x)) or (x["engine"] == "llama.cpp" and x["rec"]["launch"].get("image_commit"))


def parse_launch(x):
    """argv and env of the measured server, with GPU selection normalised for a fresh machine."""
    r = x["rec"]
    L, R = r["launch"], r["recipe"]
    cmd = L.get("command") or ""
    if re.search(r"\{(host|port|ctx|nseq)\}", cmd) or not cmd:
        d = dict(R.get("defaults") or {}, **(L.get("defaults") or {}))
        cmd = re.sub(r"\{(host|port|ctx|nseq)\}", lambda m: str(d[m.group(1)]), R["command"])
    cmd = re.sub(r"\\\s+", " ", cmd)
    argv = shlex.split(cmd)
    env = dict(L.get("env") or {})
    while argv and (argv[0] == "env" or re.match(r"^[A-Z_][A-Z0-9_]*=", argv[0])):
        a = argv.pop(0)
        if a != "env":
            k, v = a.split("=", 1)
            env[k] = v
    for k in ("HIP_VISIBLE_DEVICES", "ROCR_VISIBLE_DEVICES", "CUDA_VISIBLE_DEVICES"):
        env.pop(k, None)
    if x["dev"] != "strix":
        env = {"HIP_VISIBLE_DEVICES": ",".join(str(i) for i in range(x["gpus"])), **env}
    return argv, env


def served_name(argv):
    if "--served-model-name" in argv:
        return argv[argv.index("--served-model-name") + 1]
    if argv[:2] == ["vllm", "serve"]:
        return argv[2]
    return "local"


def download_cmd(x, zh):
    r = x["rec"]
    src = r["recipe"].get("source") or r["model"].get("source")
    path = r["recipe"].get("model") or r["model"].get("path")
    rel = path[len("/models/"):]
    local_dir, _, rest = rel.partition("/")
    if rest.endswith(".gguf"):
        sub, _, base = rest.rpartition("/")
        if "-of-" in base:
            pat = (sub + "/*") if sub else base.split("-00001-of-")[0] + "*"
            what = f' --include "{pat}"'
        else:
            what = " " + rest
    else:
        what = ""
    mirror = "# 国内网络可先设置镜像：export HF_ENDPOINT=https://hf-mirror.com" if zh else \
        "# optional mirror: export HF_ENDPOINT=https://hf-mirror.com"
    pipx = "pipx install huggingface_hub  # 或在虚拟环境里 pip install -U huggingface_hub" if zh else \
        "pipx install huggingface_hub  # or pip install -U huggingface_hub inside a venv"
    return f"{pipx}\n{mirror}\nhf download {src}{what} --local-dir ~/models/{local_dir}"


def pair_flags(args):
    """Keep each flag on the same line as its value."""
    out = []
    for a in args:
        if out and out[-1].startswith("-") and " " not in out[-1] and not a.startswith("-") and out[-1] not in ("-lc",):
            out[-1] += " " + a
        else:
            out.append(a)
    return out


def wrap(args, indent="  ", width=88):
    """Join shell words into lines no longer than width, ending in ' \\'."""
    lines, cur = [], ""
    for a in pair_flags(args):
        if cur and len(cur) + 1 + len(a) > width:
            lines.append(cur)
            cur = indent + a
        else:
            cur = (cur + " " + a) if cur else a
    lines.append(cur)
    return " \\\n".join(lines)


def docker_cmd(x, name):
    argv, env = parse_launch(x)
    inner = " ".join(shlex.quote(a) for a in argv).replace('"', '\\"')
    parts = ["docker run -d --name", name]
    head = wrap(["docker", "run", "-d", "--name", name], "  ")
    lines = [head,
             "  --device /dev/kfd --device /dev/dri --group-add video --group-add render",
             "  --security-opt seccomp=unconfined --ipc host",
             "  -v ~/models:/models -p 8000:8000"]
    if env:
        lines.append("  " + " ".join(f"-e {k}={v}" for k, v in env.items()))
    lines.append(f"  --entrypoint /bin/bash {image_of(x)}")
    # break the server command into readable lines inside the double quotes
    words = pair_flags(inner.split(" "))
    body, cur = [], "-lc \"exec"
    for w in words:
        if len(cur) + 1 + len(w) > 84 and w.startswith("-"):
            body.append(cur)
            cur = "    " + w
        else:
            cur += " " + w
    body.append(cur + '"')
    lines.append("  " + " \\\n".join(body))
    del parts
    return " \\\n".join(lines)


def build_cmd(x, zh):
    commit = x["rec"]["launch"]["image_commit"]
    argv, env = parse_launch(x)
    env.pop("LD_LIBRARY_PATH", None)
    argv = ["./build/bin/llama-server" if a == "llama-server" else a.replace("/models/", "~/models/", 1) if a.startswith("/models/") else a for a in argv]
    note = "# 编译一次即可" if zh else "# build once"
    run = wrap([f"{k}={v}" for k, v in env.items()] + [shlex.quote(a) if not a.startswith("~/") else a for a in argv], "  ")
    return (f"{note}\ngit clone {LLAMA_REPO} && cd llama.cpp\ngit checkout {commit[:12]}\n"
            'HIPCXX="$(hipconfig -l)/clang" HIP_PATH="$(hipconfig -R)" \\\n'
            f"  cmake -S . -B build -DGGML_HIP=ON -DGPU_TARGETS={GFX[x['dev']]} -DCMAKE_BUILD_TYPE=Release\n"
            "cmake --build build --config Release -j\n\n" + run)


def curl_cmd(x, zh):
    argv, _ = parse_launch(x)
    q = "用一句话介绍一下你自己。" if zh else "Introduce yourself in one sentence."
    body = json.dumps({"model": served_name(argv), "messages": [{"role": "user", "content": q}], "max_tokens": 128}, ensure_ascii=False)
    return f"curl http://localhost:8000/v1/chat/completions \\\n  -H \"Content-Type: application/json\" \\\n  -d '{body}'"


def ready_line(x):
    return "Application startup complete" if x["engine"].startswith("vLLM") else "server is listening"


def pre(s):
    return f"      <Pre>{text(s)}</Pre>"


def p(s):
    return f"      <P>{text(s)}</P>"


def h2(s):
    return f"      <H2>{text(s)}</H2>"


def h3(s):
    return f"      <H3>{text(s)}</H3>"


def where(x, zh):
    if zh:
        return f"{DEV[x['dev']]}{'' if x['gpus'] == 1 else ' ' + str(x['gpus']) + ' 卡'}、{x['engine']}、{x['quant']}"
    return f"{DEV[x['dev']]}{'' if x['gpus'] == 1 else ' x' + str(x['gpus'])}, {x['engine']}, {x['quant']}"


def tutorial(x, slug, zh, title=None):
    """Download, start, call: the full path for one measured deployment."""
    out = []
    src_build = not image_of(x)
    if zh:
        out.append(h2(title or f"三步跑起来：{DEV_LONG_ZH[x['dev']]}"))
        if src_build:
            out.append(p(f"下面是榜单上这一行的原样复现：{where(x, True)}。准备一台装好 ROCm（含 hipconfig）、CMake 和 Git 的 Linux 机器。"
                         f"我们测试 {DEV[x['dev']]} 用的镜像还没有公开，所以这里从源码编译同一个版本的 llama.cpp。"))
        else:
            out.append(p(f"下面是榜单上这一行的原样复现：{where(x, True)}。准备一台装好 ROCm 驱动和 Docker 的 Linux 机器，"
                         "当前用户需要能访问 /dev/kfd 和 /dev/dri（通常把用户加进 video 和 render 组）。"))
        out += [h3("第 1 步：下载权重"), pre(download_cmd(x, True))]
        if src_build:
            out += [h3("第 2 步：编译并启动 llama.cpp"),
                    p("命令里的 commit 和启动参数与我们测试时完全一致。"),
                    pre(build_cmd(x, True)),
                    p(f"终端里出现 “{ready_line(x)}” 就说明服务起来了。")]
        else:
            out += [h3("第 2 步：启动服务"),
                    p("镜像固定到测试时的版本，启动参数也和测试时完全一致："),
                    pre(docker_cmd(x, slug)),
                    p(f"用 docker logs -f {slug} 看日志，出现 “{ready_line(x)}” 就说明服务起来了。")]
        out += [h3("第 3 步：发一个请求"), pre(curl_cmd(x, True)),
                p("返回 JSON 里的 choices[0].message.content 就是模型的回答。这是 OpenAI 兼容接口，"
                  "Open WebUI、Cherry Studio 或各种 Agent 框架，把接口地址填成 http://localhost:8000/v1 就能用。")]
    else:
        out.append(h2(title or f"Run it in three steps on {DEV_LONG[x['dev']]}"))
        if src_build:
            out.append(p(f"This reproduces one row of the board exactly: {where(x, False)}. You need a Linux machine with ROCm (including hipconfig), CMake and Git. "
                         f"The image we used on {DEV[x['dev']]} is not public yet, so we build the same llama.cpp version from source."))
        else:
            out.append(p(f"This reproduces one row of the board exactly: {where(x, False)}. You need a Linux machine with the ROCm driver and Docker, "
                         "and your user must be able to open /dev/kfd and /dev/dri (usually by joining the video and render groups)."))
        out += [h3("Step 1: download the weights"), pre(download_cmd(x, False))]
        if src_build:
            out += [h3("Step 2: build and start llama.cpp"),
                    p("The commit and server flags are exactly the ones we measured."),
                    pre(build_cmd(x, False)),
                    p(f"The server is up when the terminal prints \u201c{ready_line(x)}\u201d.")]
        else:
            out += [h3("Step 2: start the server"),
                    p("The image is pinned to the version we measured, and the flags are the same:"),
                    pre(docker_cmd(x, slug)),
                    p(f"Watch docker logs -f {slug}; the server is up when it prints \u201c{ready_line(x)}\u201d.")]
        out += [h3("Step 3: send a request"), pre(curl_cmd(x, False)),
                p("The answer is in choices[0].message.content. The endpoint is OpenAI-compatible, so Open WebUI, Cherry Studio "
                  "or any agent framework works once you point it at http://localhost:8000/v1.")]
    return out


def other_cards(xs, hero, alts, slug, zh):
    shown = {id(hero)} | {id(a) for a in alts}
    out = [h2("换一张卡" if zh else "On other cards")]
    out.append(p("每张卡上单请求最快、而且能直接复现的那一行。下载命令同上，换成对应的文件即可。" if zh else
                 "The fastest single-request setup on each card that you can reproduce directly. Download as above, with the matching file."))
    n = 0
    for d in DEVICES:
        if d == hero["dev"]:
            continue
        cand = [x for x in xs if x["dev"] == d and x["c1"]]
        if not cand:
            continue
        ok = [x for x in cand if runnable(x)]
        best = max(cand, key=lambda x: x["c1"])
        if not ok:
            out.append(p(f"{DEV_LONG_ZH[d] if zh else DEV_LONG[d]}：" + (
                f"最快是 {where(best, True)}，单请求 {f1(best['c1'])} tok/s。这台设备用的 {best['engine']} 镜像还没有公开，完整命令见部署配方页。" if zh else
                f"fastest is {where(best, False)}, {f1(best['c1'])} tok/s for one request. The {best['engine']} image we used there is not public yet; the full command is on the Recipes page.")))
            n += 1
            continue
        x = max(ok, key=lambda x: x["c1"])
        if id(x) in shown:
            continue
        label = DEV_LONG_ZH[d] if zh else DEV_LONG[d]
        if zh:
            line = f"{label}：{where(x, True)}，单请求 {f1(x['c1'])} tok/s，32 并发 {f0(x['c32'])} tok/s。"
            if best is not x:
                line += f"（这台设备上最快的是 {where(best, True)}，{f1(best['c1'])} tok/s，但镜像还没有公开。）"
        else:
            line = f"{label}: {where(x, False)}, {f1(x['c1'])} tok/s for one request, {f0(x['c32'])} tok/s at 32."
            if best is not x:
                line += f" (The fastest here is {where(best, False)} at {f1(best['c1'])} tok/s, but its image is not public yet.)"
        out += [p(line), pre(build_cmd(x, zh) if not image_of(x) else docker_cmd(x, slug))]
        n += 1
    return out if n else []


def verdict(xs, zh):
    """One line per device: what to run alone, what to run for many users."""
    items = []
    for d in DEVICES:
        ds = [x for x in xs if x["dev"] == d and x["c1"]]
        if not ds:
            continue
        a = max(ds, key=lambda x: x["c1"])
        b = max(ds, key=lambda x: x["c32"] or 0)
        cfg_a = f"{a['engine']} {a['quant']}" + ("" if a["gpus"] == 1 else (f"（{a['gpus']} 卡）" if zh else f" on {a['gpus']} cards"))
        cfg_b = f"{b['engine']} {b['quant']}" + ("" if b["gpus"] == 1 else (f"（{b['gpus']} 卡）" if zh else f" on {b['gpus']} cards"))
        if zh:
            s = f"{DEV[d]}：单人用选 {cfg_a}，单请求 {f1(a['c1'])} tok/s"
            s += (f"；扛并发选 {cfg_b}，32 并发 {f0(b['c32'])} tok/s。" if b is not a else f"，32 并发也是它最高，{f0(a['c32'])} tok/s。")
        else:
            s = f"{DEV[d]}: for one user, {cfg_a} at {f1(a['c1'])} tok/s"
            s += (f"; for many, {cfg_b} at {f0(b['c32'])} tok/s with 32 requests." if b is not a else f"; it also leads at 32 requests, {f0(a['c32'])} tok/s.")
        items.append(s)
    return [h2("先看结论：每张卡怎么选" if zh else "The short answer: what to run on each card"), ul(items)]


def auto_tips(xs, hero, zh):
    tips = []
    if any(x["gpus"] > 1 for x in xs):
        tips.append("多卡配置要让容器看到所有卡：命令里的 HIP_VISIBLE_DEVICES 写成 0,1 或 0,1,2,3，和卡数一致。" if zh else
                    "Multi-card setups need every card visible: set HIP_VISIBLE_DEVICES to 0,1 or 0,1,2,3 to match the card count.")
    argv, _ = parse_launch(hero)
    if "--max-model-len" in argv:
        n = argv[argv.index("--max-model-len") + 1]
        if int(n) < 8192:
            tips.append(f"vLLM 命令里的 --max-model-len {n} 是按测试负载设的，日常使用请调大，显存占用会随之增加。" if zh else
                        f"--max-model-len {n} in the vLLM command fits our test load only. Raise it for real use; memory use grows with it.")
    tips.append("权重下载慢，先设置 HF_ENDPOINT=https://hf-mirror.com；提示没有权限访问 /dev/kfd，把当前用户加进 render 和 video 组后重新登录。" if zh else
                "If you get a permission error on /dev/kfd, add your user to the render and video groups and log in again.")
    return tips


def readmins(parts, zh):
    t = re.sub(r"<[^>]+>", "", "\n".join(parts))
    if zh:
        return max(3, round(len(re.findall(r"[\u4e00-\u9fff]", t)) / 400 + 1))
    return max(3, round(len(t.split()) / 220 + 1))


def model_post(m, xs, rows_all, zh=False):
    slug, name, _, _ = m
    st = STORIES[slug]
    L = st["zh" if zh else "en"]
    hero = find(xs, st["hero"])
    alts = [find(xs, a) for a in st.get("alt", [])]
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    engines = sorted({x["engine"] for x in xs})
    tags = (["模型", name] if zh else ["Model", name]) + [DEV[d] for d in devs] + engines

    lead = [f"      <Lead>{text(L['lead'][0])}</Lead>"] + [p(s) for s in L["lead"][1:]]
    story = []
    for h, paras in L["sections"]:
        story += [h2(h)] + [p(s) for s in paras]
    tut = tutorial(hero, slug, zh)
    for a in alts:
        t = (f"另一种跑法：{where(a, True)}" if zh else f"Another way: {where(a, False)}")
        ta = tutorial(a, slug + "-2", zh, t)
        ta.insert(2, p(f"两种跑法都用 8000 端口，换之前先停掉上一个服务（docker rm -f {slug}）。" if zh else
                       f"Both setups use port 8000; stop the first one before switching (docker rm -f {slug})."))
        tut += ta
    others = other_cards(xs, hero, alts, slug, zh)
    tbl = [h2("实测数据" if zh else "Measured results"),
           p("加粗行是每张卡上单请求最快的配置。单请求是一个用户看到的生成速度；32 并发是 32 个请求同时进来时的合计速度；TTFT 是首 token 时延。" if zh else
             "Bold rows are the fastest single-request setup on each card. 1 req is the speed one user sees; 32 req is the combined rate of 32 requests at once; TTFT is time to first token."),
           table(xs, zh)]
    tips = [h2("注意事项" if zh else "Things to watch"), ul(L.get("tips", []) + auto_tips(xs, hero, zh))]
    links = [(link(f"/{d}/recipes", zh), (f"{DEV[d]} 部署配方" if zh else f"{DEV[d]} recipes")) for d in devs]
    links += [(link(f"/{devs[0]}/leaderboard", zh), "榜单" if zh else "Leaderboard")]
    nxt = [h2("下一步" if zh else "Next steps"),
           p("每一行实测的完整镜像和命令都在部署配方页，换模型、换卡时直接照抄：" if zh else
             "Every measured row's image and full command is on the Recipes pages; copy from there for other models and cards:"),
           "      <UL>\n" + "".join(f'        <li><A href="{h}">{text(t)}</A></li>\n' for h, t in links) + "      </UL>",
           f"      <P>{text('用 Claude Code、Codex 这类编码 Agent 部署？让它先调用 ' if zh else 'Deploying with a coding agent such as Claude Code or Codex? Have it call the ')}"
           f"<A href=\"{link('/docs', zh)}\">{text('AMD GPU 支持助手' if zh else 'AMD GPU Support Agent')}</A>"
           f"{text('。' if zh else ' first.')}</P>"]
    method = [h2("测试方法" if zh else "How we measured")] + [p(s) for s in (METHOD_ZH if zh else METHOD)]

    layout = st.get("layout", "tutorial")
    if layout == "data":
        body = lead + story + tbl + tut + others + tips + nxt + method
    elif layout == "compare":
        body = lead + verdict(xs, zh) + story + tbl + tut + others + tips + nxt + method
    else:
        body = lead + verdict(xs, zh) + tut + others + story + tbl + tips + nxt + method
    out = [f"  {{\n    slug: {js('model-' + slug)},\n    title: {js(L['title'])},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: {readmins(body, zh)},\n    tags: {js(tags)},\n    excerpt: {js(L['excerpt'])},",
           "    content: (\n      <>", *body, "      </>\n    ),\n  },"]
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
ENGINE_INTRO_ZH = {
    "vllm": [
        "三台设备都测了 vLLM，用它跑 BF16 权重，以及它在 ROCm 上支持的量化格式：AWQ、AMD Quark W8A8-INT8 和 Intel AutoRound INT4。DiffusionGemma 需要 vLLM 的 main 分支，单独标成 vLLM (main)。",
        "每条结果都绑定固定版本的镜像，不用会变的标签；每一行的镜像和完整启动命令都在对应设备的“部署配方”页上。R9700 上的服务加了 --attention-backend TRITON_ATTN。",
    ],
    "llamacpp": [
        "榜单上所有 GGUF 结果都用 llama.cpp 的 ROCm/HIP 后端跑，三台设备都有。典型的启动命令是 llama-server -ngl 999 -fa on -c 32768 -np 32：所有层放到 GPU 上，打开 flash attention，32 个并行槽位共用 32K 上下文。多卡运行时按层切到各张卡上。在 Strix Halo 上，最大的几个模型按配方加 --no-mmap 或 --load-mode none 加载。",
        "每条结果都绑定固定版本的镜像，不用会变的标签。Strix Halo 上 7 月测的模型所用的 llama.cpp 版本，比 11 月新增模型所用的旧，跨这两批比较时要留意。每一行的镜像和命令都在对应设备的“部署配方”页上。",
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
ENGINE_NOTES_ZH = {
    "vllm": [
        "vLLM 的长处在并发。下表里每一组权重、设备、卡数都相同的对比中，vLLM 在 32 并发时的总吞吐都高于 llama.cpp，常常高出好几倍。",
        "单请求则互有胜负：在 Strix Halo 上，Qwen3.6-35B-A3B 的 BF16 是 llama.cpp 更快（22.0 对 17.1 tok/s）；W7900 双卡 BF16 跑 Qwen3.6-27B 也是 llama.cpp 更快（11.9 对 7.2）。",
        "vLLM 的量化格式不一定能提高单请求速度。在 R9700 上，Qwen3.6-27B 用 Quark W8A8-INT8 双卡是 11.8 tok/s，BF16 双卡是 20.8。",
    ],
    "llamacpp": [
        "要把模型塞进显存，llama.cpp 最省事：从 2 比特到 BF16 的 GGUF 量化都用同一个服务程序跑，榜单上 100 GB 级别的模型也只在这里跑。",
        "单请求速度跟着权重大小走，所以量化的收益很直接。下表列出在一张卡上同时测了 BF16（或 F16）、Q8_0 和 4 比特版本的模型，各自的单请求解码速度。",
        "32 并发时的总吞吐增长不如 vLLM，有些配置在 4 或 16 并发到顶后反而下降；各模型的文章里列出了这些情况。",
    ],
}


def engine_post(key, rows_all, zh=False):
    name = {"vllm": "vLLM", "llamacpp": "llama.cpp"}[key]
    engines = ["vLLM", "vLLM (main)"] if key == "vllm" else ["llama.cpp"]
    xs = [x for x in rows_all if x["engine"] in engines]
    models = {x["slug"]: x for x in xs}
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    mname = {m[0]: m[1] for m in MODELS}
    hero_slug, hero_spec = ("qwen3-4b", ("r9700", "vLLM", "BF16", 1)) if key == "vllm" else ("qwen3-30b-a3b", ("strix", "llama.cpp", "Q4_K_M", 1))
    hero = find([x for x in rows_all if x["slug"] == hero_slug], hero_spec)
    hname = mname[hero["slug"]]
    if zh:
        counts = "，".join(f"{DEV[d]} {sum(1 for x in xs if x['dev'] == d)} 组" for d in devs)
        if key == "vllm":
            title = f"用 vLLM 在 AMD Radeon 上部署大模型：单卡 32 并发 {f0(hero['c32'])} tok/s，什么时候该选它"
            excerpt = f"一张 R9700 跑 {hname}，32 个请求同时进来总吞吐 {f0(hero['c32'])} tok/s。{len(xs)} 组实测告诉你 vLLM 在 AMD 显卡上怎么跑、什么时候比 llama.cpp 强。"
            lead = [f"想把本地模型做成一个能同时服务很多人的 API，vLLM 是首选。一张 R9700 跑 {hname}，32 个请求同时进来，总吞吐 {f0(hero['c32'])} tok/s。",
                    f"榜单上有 {len(xs)} 组 vLLM 实测，覆盖 {len(models)} 个模型（{counts}）。本文先给一条能直接复制的启动命令，再讲它什么时候比 llama.cpp 强、什么时候不如。"]
        else:
            title = f"用 llama.cpp 在 AMD Radeon 上跑大模型：{len(models)} 个模型、{len(xs)} 组实测，量化怎么选"
            excerpt = f"一个 GGUF 文件、一条命令，从 2 比特到 BF16 都能跑。{len(xs)} 组实测，告诉你在 AMD 显卡上怎么部署、量化怎么选。"
            lead = [f"llama.cpp 是在 AMD 显卡上跑本地模型最省事的方式：一个 GGUF 文件、一条命令，从 2 比特到 BF16 都能跑，单机跑不下的超大模型也能切到多张卡上。",
                    f"榜单上有 {len(xs)} 组 llama.cpp 实测，覆盖 {len(models)} 个模型（{counts}）。比如在 Strix Halo 迷你主机上，{hname} 的 Q4_K_M 单请求 {f1(hero['c1'])} tok/s。下面先给命令，再讲量化怎么选。"]
        tags = ["引擎", name] + [DEV[d] for d in devs]
        h_run, h_see = "我们怎么跑", "从数据看"
        intro, notes, method = ENGINE_INTRO_ZH[key], ENGINE_NOTES_ZH[key], METHOD_ZH
    else:
        counts = "; ".join(f"{DEV[d]} {sum(1 for x in xs if x['dev'] == d)}" for d in devs)
        if key == "vllm":
            title = f"Serving LLMs with vLLM on AMD Radeon: {f0(hero['c32'])} tok/s at 32 requests on one card, and when to choose it"
            excerpt = f"One R9700 serves {hname} at {f0(hero['c32'])} tok/s with 32 requests in flight. {len(xs)} measured setups show how to run vLLM on AMD GPUs and when it beats llama.cpp."
            lead = [f"To turn a local model into an API that serves many people at once, vLLM is the first choice. One R9700 running {hname} delivers {f0(hero['c32'])} tok/s in total with 32 requests in flight.",
                    f"The board has {len(xs)} measured vLLM setups covering {len(models)} models (per device: {counts}). Here is a command you can paste, then when vLLM beats llama.cpp and when it does not."]
        else:
            title = f"Running LLMs with llama.cpp on AMD Radeon: {len(models)} models, {len(xs)} measured setups, and how to pick a quantization"
            excerpt = f"One GGUF file and one command, from 2-bit to BF16. {len(xs)} measured setups show how to deploy on AMD GPUs and which quantization to pick."
            lead = [f"llama.cpp is the simplest way to run local models on AMD GPUs: one GGUF file, one command, anything from 2-bit to BF16, and models too large for one card can be split across several.",
                    f"The board has {len(xs)} measured llama.cpp setups covering {len(models)} models (per device: {counts}). On a Strix Halo mini PC, for example, {hname} Q4_K_M decodes {f1(hero['c1'])} tok/s for one request. Commands first, then quantization."]
        tags = ["Engine", name] + [DEV[d] for d in devs]
        h_run, h_see = "How we run it", "What we see"
        intro, notes, method = ENGINE_INTRO[key], ENGINE_NOTES[key], METHOD
    out = [f"  {{\n    slug: {js('engine-' + ('vllm' if key == 'vllm' else 'llama-cpp'))},\n    title: {js(title)},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: 6,\n    tags: {js(tags)},\n    excerpt: {js(excerpt)},",
           "    content: (\n      <>",
           f"      <Lead>{text(lead[0])}</Lead>",
           f"      <P>{text(lead[1])}</P>",
           *tutorial(hero, "engine-" + key, zh, (f"三步跑起来：{hname} 示例" if zh else f"Run it in three steps: {hname} as the example")),
           f"      <H2>{h_run}</H2>",
           *[f"      <P>{text(p)}</P>" for p in intro],
           f"      <H2>{h_see}</H2>",
           ul(notes)]
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
        if zh:
            h2, p, head = ("vLLM 与 llama.cpp：相同权重、相同卡数", "单请求的解码 tok/s，以及 32 并发时的总 tok/s。",
                           ["模型", "设备", "权重格式", "卡数", "vLLM 单请求", "llama.cpp 单请求", "vLLM 32 并发", "llama.cpp 32 并发"])
        else:
            h2, p, head = ("vLLM against llama.cpp, same weights and cards", "Decode tok/s for one request and total tok/s at 32 concurrent requests.",
                           ["Model", "Device", "Weights", "GPUs", "vLLM 1 req", "llama.cpp 1 req", "vLLM 32 req", "llama.cpp 32 req"])
        out += [f"      <H2>{h2}</H2>", f"      <P>{text(p)}</P>",
                "      <Table\n        head={" + js(head) + "}\n        numericFrom={3}\n        rows={[\n"
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
                    r = q4["c1"] / full["c1"]
                    qrows.append([mname[s], DEV[d], f1(full["c1"]), f1(q8["c1"]), f1(q4["c1"]), q4["quant"], f"{r:.1f} 倍" if zh else f"{r:.1f}x"])
        if zh:
            h2, p, head = ("单卡上的量化收益", "单请求解码 tok/s。最后一列是 4 比特版本相对 BF16 或 F16 的倍数。",
                           ["模型", "设备", "BF16/F16", "Q8_0", "4 比特", "4 比特格式", "4 比特相对 16 比特"])
        else:
            h2, p, head = ("Quantization on one card", "Single-request decode tok/s. The last column is the 4-bit build against BF16 or F16.",
                           ["Model", "Device", "BF16/F16", "Q8_0", "4-bit", "4-bit format", "4-bit vs 16-bit"])
        out += [f"      <H2>{h2}</H2>", f"      <P>{text(p)}</P>",
                "      <Table\n        head={" + js(head) + "}\n        numericFrom={2}\n        rows={[\n"
                + ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in qrows) + ",\n        ]}\n      />"]
    rows = []
    for x in sorted(xs, key=lambda x: (mname[x["slug"]], DEVICES.index(x["dev"]), x["gpus"], x["quant"])):
        rows.append([mname[x["slug"]], DEV[x["dev"]], x["quant"], str(x["gpus"]), f1(x["c1"]) if x["c1"] else "\u2014", f0(x["c32"]) if x["c32"] else "\u2014"])
    if zh:
        h_all, p_all, head = (f"全部 {name} 结果", "每个模型都有单独一篇文章，列出它在各个引擎上的全部部署。",
                              ["模型", "设备", "权重格式", "卡数", "单请求 tok/s", "32 并发 tok/s"])
        h_posts, h_method = "各模型文章", "测试方法"
    else:
        h_all, p_all, head = (f"Every {name} result", "Each model has its own post with all of its deployments on every engine.",
                              ["Model", "Device", "Weights", "GPUs", "1 req tok/s", "32 req tok/s"])
        h_posts, h_method = "Model posts", "Method"
    out += [f"      <H2>{h_all}</H2>",
            f"      <P>{text(p_all)}</P>",
            "      <Table\n        head={" + js(head) + "}\n        numericFrom={3}\n        rows={[\n"
            + ",\n".join("        [" + ", ".join(js(c) for c in r) + "]" for r in rows) + ",\n        ]}\n      />",
            f"      <H2>{h_posts}</H2>",
            "      <UL>\n" + "".join(f'        <li><A href="{link("/blog/model-" + s, zh)}">{text(mname[s])}</A></li>\n' for s in [m[0] for m in MODELS] if s in models) + "      </UL>",
            f"      <H2>{h_method}</H2>",
            *[f"      <P>{text(p)}</P>" for p in method],
            "      </>\n    ),\n  },"]
    return "\n".join(out)


def story_texts(slug, lang):
    L = STORIES[slug][lang]
    return [L["title"], L["excerpt"], *L["lead"], *[t for h, ps in L["sections"] for t in [h, *ps]], *L.get("tips", [])]


NUM = re.compile(r"(?<![\w.\-])\d+(?:,\d{3})*(?:\.\d+)?(?![\w])|(?<=-)\d+(?:\.\d+)?(?![\w.])")


def check_notes(rows_all):
    """Every number written by hand must be a measurement (rounded), a ratio of two
    measurements of the same model, or an allowed hardware/version fact."""
    vals = set()
    by = collections.defaultdict(list)
    for x in rows_all:
        by[x["slug"]].append(x)
        for v in list(x["curve"].values()) + [x["ttft"] or 0]:
            vals |= {f"{v:.1f}", f"{v:,.0f}", f"{v:.0f}", f"{v/1000:.1f}"}
    ratios = collections.defaultdict(set)
    for slug, xs in by.items():
        for key in ("c1", "c32"):
            ms = [x[key] for x in xs if x[key]]
            ratios[slug] |= {f"{a / b:.1f}" for a in ms for b in ms} | {f"{a / b:.0f}" for a in ms for b in ms if 2.5 <= a / b}
    allowed = {"1", "2", "4", "8", "16", "32", "512", "100", "0", "3", "5"} | ALLOWED_FACTS
    bad = []
    texts = [("", t) for d in (ENGINE_NOTES, ENGINE_NOTES_ZH) for ts in d.values() for t in ts]
    texts += [(slug, t) for slug in STORIES for lang in ("zh", "en") for t in story_texts(slug, lang)]
    for slug, t in texts:
        for n in NUM.findall(re.sub(r"(\d)x\b", r"\1 x", t)):
            if n not in vals and n not in allowed and n not in ratios.get(slug, ()):
                bad.append((slug, n, t[:70]))
    if bad:
        raise SystemExit("numbers not found in bundle:\n" + "\n".join(map(repr, bad)))


def check_pairs():
    """English and Chinese hand-written texts must use the same numbers."""
    def nums(s, zh):
        if zh:
            s = re.sub(r"\d+ 月", "", s)
        return set(NUM.findall(re.sub(r"(\d)x\b", r"\1 x", s))) - {"1"}  # "1 request" is written as 单请求

    pairs = [(desc, MODEL_ZH[slug]) for slug, _, _, desc in MODELS]
    for en, zh in ((ENGINE_NOTES, ENGINE_NOTES_ZH), (ENGINE_INTRO, ENGINE_INTRO_ZH)):
        assert set(en) == set(zh) and all(len(en[k]) == len(zh[k]) for k in en)
        pairs += [p for k in en for p in zip(en[k], zh[k])]
    assert len(METHOD) == len(METHOD_ZH)
    pairs += list(zip(METHOD, METHOD_ZH))
    for slug in STORIES:
        e, z = story_texts(slug, "en"), story_texts(slug, "zh")
        assert len(e) == len(z), slug
        pairs += list(zip(e, z))
    bad = [(sorted(nums(e, False) ^ nums(z, True)), e[:60]) for e, z in pairs if nums(e, False) != nums(z, True)]
    if bad:
        raise SystemExit("English and Chinese numbers differ:\n" + "\n".join(map(repr, bad)))


def main():
    bundle, rows_all = load(sys.argv[1])
    check_notes(rows_all)
    check_pairs()
    by = collections.defaultdict(list)
    for x in rows_all:
        by[x["slug"]].append(x)
    print("// Generated by scripts/gen-blog-posts.py from radeonrun bundle "
          f"{bundle.get('short_commit')} ({bundle.get('generated_at', '')[:10]}). Do not edit by hand.")
    print('import { A, H2, H3, Lead, P, Pre, Table, UL, type BlogPost } from "./blogUi";\n')
    for zh, suffix in ((False, ""), (True, "_ZH")):
        print(f"export const ENGINE_POSTS{suffix}: BlogPost[] = [")
        print(engine_post("vllm", rows_all, zh))
        print(engine_post("llamacpp", rows_all, zh))
        print("];\n")
        print(f"export const MODEL_POSTS{suffix}: BlogPost[] = [")
        for m in MODELS:
            print(model_post(m, by[m[0]], rows_all, zh))
        print("];\n")

if __name__ == "__main__":
    main()
