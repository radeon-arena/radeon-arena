#!/usr/bin/env python3
"""Generate src/lib/blogModels.tsx: one blog post per model and one per engine,
in English (ENGINE_POSTS, MODEL_POSTS) and Chinese (ENGINE_POSTS_ZH, MODEL_POSTS_ZH).

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

# Extra hand-written observations. Numbers here were copied from the bundle and
# are checked against it by check_notes() below. NOTES_ZH says the same in Chinese.
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

NOTES_ZH = {
    "qwen3-4b": [
        "只有 R9700 跑了这个模型的 vLLM。单卡 32 并发时，vLLM 总吞吐达到 1,639 tok/s，同一张卡上 llama.cpp 跑 Q4_K_M 只有 565；但单请求是 llama.cpp Q4_K_M 更快（123.8 对 70.3 tok/s）。",
    ],
    "qwen3-30b-a3b": [
        "BF16+YaRN 这几行用的是同一份权重，只是打开了面向长上下文的 YaRN RoPE 缩放。测试提示词只有 512 个 token，所以这几行反映的是短上下文下这项设置的代价：W7900 上 vLLM 双卡，单请求 69.0 对 75.5 tok/s，32 并发 308 对 498 tok/s。",
    ],
    "qwen3.6-27b": [
        "在 R9700 上，vLLM 跑 Quark W8A8-INT8 并不划算：双卡单请求只有 11.8 tok/s，同样双卡的 BF16 是 20.8。在 Strix Halo 上它的单请求确实快过 BF16，7.8 对 4.3 tok/s。",
    ],
    "qwen3.6-35b-a3b": [
        "这是榜单上部署组合最多的模型：llama.cpp 跑了 BF16、Q8_0 和 UD-Q4_K_M，vLLM 跑了 BF16、AWQ-4bit、Quark W8A8-INT8 和 Intel 的 INT4 AutoRound。其中 AWQ 和 Quark 权重是第三方量化的。",
        "在 Strix Halo 上，vLLM 最快的格式是 INT4 AutoRound，单请求 37.8 tok/s，32 并发 189；但单请求还是 llama.cpp 跑 UD-Q4_K_M 更快，49.3 tok/s。",
    ],
    "qwen3.8-flash-next": [
        "只测了低比特的 UD 版本。R9700 和 W7900 上分摊到四张卡，Strix Halo 则用自带的单块集成显卡跑。",
    ],
    "diffusiongemma-26b-a4b": [
        "DiffusionGemma 每次对一整块 token 反复细化，而不是一个接一个地生成，所以流式输出的第一个 token 来得晚：在 W7900 上，请求发出 6.3 秒后才到。它跑在 vLLM 的 main 分支上。",
        "并发超过 4 之后，总吞吐几乎不再增长。W7900 上的服务启动时把最大序列数设成了 4。",
    ],
    "gemma-4-31b": [
        "只测了 Quark W8A8-INT8 版本，用的是 vLLM。",
    ],
    "mimo-v2.6-flash": [
        "只测了 2 比特的 IQ2_XS_M 版本，分摊到四张卡。512 token 提示词的首 token 时延，W7900 是 2.7 秒，R9700 是 5.1 秒。",
    ],
    "deepseek-v4-flash": [
        "只测了 2 比特的 UD-Q2_K_XL 版本。R9700 和 W7900 分摊到四张卡，Strix Halo 用自带的单块集成显卡跑。",
    ],
    "glm-5.3-flash": [
        "只测了 2 比特的 UD-IQ2_XXS 版本，用四张卡。没有在 Strix Halo 上测。",
    ],
}

assert set(MODEL_ZH) == {m[0] for m in MODELS}
assert set(NOTES_ZH) == set(NOTES) and all(len(NOTES_ZH[k]) == len(NOTES[k]) for k in NOTES)


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
    "\u201c1 request\u201d is the decode speed one user sees. \u201c32 requests\u201d is the combined decode rate of all 32. TTFT is the time to the first token for a single request. Strix Halo runs from July 2026 used an earlier version of the harness, whose prompts could partly hit the prefix cache, so their TTFT is not shown.",
    "R9700 numbers are the best of the runs we made with the same image and command. All numbers are on the leaderboard, and every row's engine image and full command are on the device's Recipes page.",
]
METHOD_ZH = [
    "用 llama-benchy 向服务的 OpenAI 兼容接口发流式请求：提示词 512 个 token，生成 128 个 token，并发数分别为 1、4、16 和 32。每个测点先预热，再取三次运行的中位数。提示词均为纯文本。",
    "\u201c单请求\u201d是一个用户实际看到的解码速度；\u201c32 并发\u201d是 32 个请求合计的解码速度。TTFT 即首 token 时延，是单请求时等到第一个 token 的时间。Strix Halo 在 2026 年 7 月的结果用的是早期版本的测试工具，提示词可能部分命中前缀缓存，所以不列 TTFT。",
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


def model_post(m, xs, rows_all, zh=False):
    slug, name, _, desc = m
    devs = [d for d in DEVICES if any(x["dev"] == d for x in xs)]
    engines = sorted({x["engine"] for x in xs})
    quants = sorted({x["quant"] for x in xs})
    b = max((x for x in xs if x["c1"]), key=lambda x: x["c1"])
    sources = sorted({x["source"] for x in xs if x["source"]})
    if zh:
        title = f"{name} 在 AMD Radeon 上的全部实测结果"
        desc_zh = MODEL_ZH[slug]
        sp = " " if desc_zh[0].isascii() else ""
        where = join_list([DEV_LONG_ZH[d] for d in devs], True)
        where += "上" if where.endswith("）") else " 上"
        if len(xs) > 1:
            lead = (f"{name} 是{sp}{desc_zh}。我们在 {where}测了它的 {len(xs)} 种部署配置，"
                    f"引擎为 {join_list(engines, True)}，共 {len(quants)} 种权重格式。本文把这些结果放在一起对比。")
            excerpt = (f"{name} 在 {'、'.join(DEV[d] for d in devs)} 上共 {len(xs)} 种实测部署。"
                       f"单请求最快：{f1(b['c1'])} tok/s（{cfg(b, True, True)}）。")
        else:
            lead = f"{name} 是{sp}{desc_zh}。我们在 {where}测了它的一种部署：{cfg(b, False, True)}。"
            excerpt = f"{name} 在 {DEV[b['dev']]} 上的实测部署：单请求 {f1(b['c1'])} tok/s（{cfg(b, False, True)}）。"
        tags = ["模型", name] + [DEV[d] for d in devs] + engines
        h = ["全部部署", "从数据看", "权重来源", "测试方法与配方"]
        intro = "加粗行是每台设备上单请求最快的配置。卡数是服务用了几张显卡；并发指同时发出的请求数。"
        method = METHOD_ZH
        tail = (f"      <P>{text('配方：')}{recipe_links(devs, True)}{text('。榜单：')}"
                f"<A href=\"{link('/' + devs[0] + '/leaderboard', True)}\">{text(DEV[devs[0]])}</A>{text('。')}</P>")
        notes = NOTES_ZH.get(slug, [])
        minutes = 3
    else:
        title = name + " on AMD Radeon: every deployment we measured"
        if len(xs) > 1:
            lead = (f"{name} is {desc}. We measured {len(xs)} deployments of it on "
                    f"{join_list([DEV_LONG[d] for d in devs], False)}, "
                    f"with {' and '.join(engines)} and {len(quants)} weight format{'s' if len(quants) > 1 else ''}. This post puts them side by side.")
            excerpt = (f"{len(xs)} measured deployments of {name} across "
                       f"{', '.join(DEV[d] for d in devs)}. Fastest single request: {f1(b['c1'])} tok/s with {cfg(b)}.")
        else:
            lead = f"{name} is {desc}. We measured one deployment of it on {DEV_LONG[b['dev']]}: {cfg(b, False)}."
            excerpt = f"One measured deployment of {name} on {DEV[b['dev']]}: {f1(b['c1'])} tok/s for a single request with {cfg(b, False)}."
        tags = ["Model", name] + [DEV[d] for d in devs] + engines
        h = ["All deployments", "What the numbers say", "Weights", "Method and recipes"]
        intro = "Bold rows are the fastest single-request setup on each device. GPUs is the number of cards the server used; req means concurrent requests."
        method = METHOD
        tail = (f"      <P>{text('Recipes: ')}{recipe_links(devs)}{text('. Leaderboard: ')}"
                f"<A href=\"/{devs[0]}/leaderboard\">{text(DEV[devs[0]])}</A>{text('.')}</P>")
        notes = NOTES.get(slug, [])
        minutes = 3
    out = [f"  {{\n    slug: {js('model-' + slug)},\n    title: {js(title)},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: {minutes},\n    tags: {js(tags)},\n    excerpt: {js(excerpt)},",
           "    content: (\n      <>",
           f"      <Lead>{text(lead)}</Lead>",
           f"      <H2>{h[0]}</H2>",
           f"      <P>{text(intro)}</P>",
           table(xs, zh),
           f"      <H2>{h[1]}</H2>",
           ul(auto_points(xs, zh) + notes),
           f"      <H2>{h[2]}</H2>",
           ul(sources),
           f"      <H2>{h[3]}</H2>",
           *[f"      <P>{text(p)}</P>" for p in method],
           tail,
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
    if zh:
        counts = "，".join(f"{DEV[d]} {sum(1 for x in xs if x['dev'] == d)} 条" for d in devs)
        title = f"{name} 在 AMD Radeon 上的全部实测结果"
        excerpt = (f"榜单上全部 {len(xs)} 条 {name} 结果，覆盖 {len(models)} 个模型，设备包括 {'、'.join(DEV[d] for d in devs)}："
                   f"能跑什么、跑多快，{name} 在哪些情况下占优、在哪些情况下吃亏。")
        lead = f"榜单上有 {len(xs)} 条结果是用 {name} 跑的，覆盖 {len(models)} 个模型（按设备分：{counts}）。本文把它们集中到一处。"
        tags = ["引擎", name] + [DEV[d] for d in devs]
        h_run, h_see = "运行方式", "从数据看"
        intro, notes, method = ENGINE_INTRO_ZH[key], ENGINE_NOTES_ZH[key], METHOD_ZH
    else:
        counts = "; ".join(f"{DEV[d]} {sum(1 for x in xs if x['dev'] == d)}" for d in devs)
        title = name + " on AMD Radeon: all our results in one place"
        excerpt = f"All {len(xs)} {name} results on the board, {len(models)} models across {', '.join(DEV[d] for d in devs)}: what runs, how fast, and where {name} wins or loses."
        lead = f"{len(xs)} of the board's results run on {name}, covering {len(models)} models (results per device: {counts}). This post collects them in one place."
        tags = ["Engine", name] + [DEV[d] for d in devs]
        h_run, h_see = "How we run it", "What we see"
        intro, notes, method = ENGINE_INTRO[key], ENGINE_NOTES[key], METHOD
    out = [f"  {{\n    slug: {js('engine-' + ('vllm' if key == 'vllm' else 'llama-cpp'))},\n    title: {js(title)},",
           f"    date: {js(POST_DATE)},\n    readingMinutes: 5,\n    tags: {js(tags)},\n    excerpt: {js(excerpt)},",
           "    content: (\n      <>",
           f"      <Lead>{text(lead)}</Lead>",
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


def check_notes(rows_all):
    """Every number written by hand in NOTES/ENGINE_NOTES must appear in the bundle (rounded)."""
    vals = set()
    for x in rows_all:
        for v in list(x["curve"].values()) + [x["ttft"] or 0]:
            vals |= {f"{v:.1f}", f"{v:,.0f}", f"{v:.0f}", f"{v/1000:.1f}"}
    allowed = {"1", "2", "4", "8", "16", "32", "512", "100", "0", "3", "5"}
    bad = []
    texts = [t for d in (NOTES, NOTES_ZH, ENGINE_NOTES, ENGINE_NOTES_ZH) for ts in d.values() for t in ts]
    for t in texts:
        for n in re.findall(r"(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?", t):
            if n not in vals and n not in allowed:
                bad.append((n, t[:80]))
    if bad:
        raise SystemExit("numbers not found in bundle: " + repr(bad))


def check_pairs():
    """English and Chinese hand-written texts must use the same numbers."""
    num = re.compile(r"(?<![A-Za-z0-9_.\-])\d+(?:,\d{3})*(?:\.\d+)?")

    def nums(s, zh):
        if zh:
            s = re.sub(r"\d+ 月", "", s)
        return set(num.findall(s)) - {"1"}  # "1 request" is written as 单请求

    pairs = [(desc, MODEL_ZH[slug]) for slug, _, _, desc in MODELS]
    for en, zh in ((NOTES, NOTES_ZH), (ENGINE_NOTES, ENGINE_NOTES_ZH), (ENGINE_INTRO, ENGINE_INTRO_ZH)):
        assert set(en) == set(zh) and all(len(en[k]) == len(zh[k]) for k in en)
        pairs += [p for k in en for p in zip(en[k], zh[k])]
    assert len(METHOD) == len(METHOD_ZH)
    pairs += list(zip(METHOD, METHOD_ZH))
    bad = [(sorted(nums(e, False) ^ nums(z, True)), e[:60]) for e, z in pairs if nums(e, False) != nums(z, True)]
    if bad:
        raise SystemExit("English and Chinese numbers differ: " + repr(bad))


def main():
    bundle, rows_all = load(sys.argv[1])
    check_notes(rows_all)
    check_pairs()
    by = collections.defaultdict(list)
    for x in rows_all:
        by[x["slug"]].append(x)
    print("// Generated by scripts/gen-blog-posts.py from radeonrun bundle "
          f"{bundle.get('short_commit')} ({bundle.get('generated_at', '')[:10]}). Do not edit by hand.")
    print('import { A, H2, Lead, P, Table, UL, type BlogPost } from "./blogUi";\n')
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
