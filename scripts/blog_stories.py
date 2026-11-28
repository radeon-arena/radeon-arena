"""Hand-written angle for every model post: title, hook, the section that makes
the post worth reading, and model-specific tips, in Chinese and English.

Rules (checked by gen-blog-posts.py):
- every number must exist in the bundle (rounded as shown), be a ratio of two
  measurements of the same model, or be a hardware fact listed in ALLOWED_FACTS;
- the Chinese and English versions of each text must use the same numbers.

`hero` is the deployment the step-by-step tutorial uses: (device, engine,
weights, gpus). `alt` adds a second full command. `layout` picks the section
order: "tutorial" (commands first), "data" (the finding first) or "compare"
(decision table, then the comparison).
"""

# VRAM sizes, prompt length, port, recipe flags, small counts, model versions
ALLOWED_FACTS = {"32", "48", "60", "100", "128", "512", "2304", "8000", "8192", "32768", "20"} | {str(i) for i in range(10)} | {
    "2.5", "2.6", "3.0", "3.1", "3.5", "3.6", "3.8", "4.2", "4.7", "5.3"}

STORIES = {
    "qwen3-4b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        alt=[("r9700", "vLLM", "BF16", 1)],
        layout="compare",
        zh=dict(
            title="Qwen3-4B 上 AMD Radeon：一张 R9700，单人 123.8 tok/s，32 人并发 1,639 tok/s",
            excerpt="同一张 R9700，llama.cpp 让一个人用得最快，vLLM 让一群人一起用得最快。两条命令都给你，复制就能跑。",
            lead=[
                "4B 的模型放在一张 32GB 的 R9700 上，显存不是问题，问题是你想怎么用它：自己一个人当助手，还是搭成服务给团队一起用？",
                "这两种用法的最优解不一样。我们在 R9700 上实测：llama.cpp 跑 Q4_K_M，单请求 123.8 tok/s；vLLM 跑 BF16，32 个请求同时进来，总吞吐 1,639 tok/s。下面先说怎么选，再给两条可以直接复制的启动命令。",
            ],
            sections=[
                ("一个人用和一群人用，答案相反", [
                    "单请求时，llama.cpp 的 Q4_K_M 是 123.8 tok/s，vLLM 的 BF16 只有 70.3。原因很直接：单请求的解码速度主要看每生成一个 token 要从显存读多少权重，4 比特权重比 16 比特小得多。",
                    "并发一上来，局面就反过来了。32 并发时 vLLM 总吞吐 1,639 tok/s，是 llama.cpp（565）的 2.9 倍。vLLM 的连续批处理和分页 KV 缓存就是为这种场景设计的。",
                    "所以规则很简单：桌面助手、写代码补全，用 llama.cpp；内部 API、批量处理，用 vLLM。",
                ]),
            ],
            tips=["vLLM 配方的 --max-model-len 是 8192。需要更长的上下文可以调大，显存占用会随之增加。"],
        ),
        en=dict(
            title="Qwen3-4B on AMD Radeon: one R9700, 123.8 tok/s for one user, 1,639 tok/s for 32",
            excerpt="On the same R9700, llama.cpp is fastest for one user and vLLM is fastest for many. Both commands are below, ready to paste.",
            lead=[
                "A 4B model fits easily on a 32GB R9700. The real question is how you will use it: as your own assistant, or as a service the whole team calls?",
                "The best setup differs. On R9700, llama.cpp with Q4_K_M decodes 123.8 tok/s for a single request, while vLLM with BF16 reaches 1,639 tok/s in total with 32 requests in flight. Here is how to choose, followed by two commands you can paste.",
            ],
            sections=[
                ("One user or many: opposite answers", [
                    "For one request, llama.cpp with Q4_K_M runs at 123.8 tok/s and vLLM with BF16 at 70.3. Single-request decoding is bound by how many weight bytes are read per token, and 4-bit weights are much smaller than 16-bit ones.",
                    "Under load it flips. At 32 concurrent requests vLLM delivers 1,639 tok/s in total, 2.9x llama.cpp's 565. Continuous batching and paged KV cache are built for exactly this.",
                    "The rule: for a desktop assistant or code completion, use llama.cpp; for an internal API or batch jobs, use vLLM.",
                ]),
            ],
            tips=["The vLLM recipe sets --max-model-len 8192. Raise it for longer context; memory use grows with it."],
        ),
    ),
    "qwen3-8b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="在 AMD 迷你主机上跑 Qwen3-8B：Strix Halo 单请求 40.1 tok/s，W7900 87.2",
            excerpt="8B 是本地助手最常见的尺寸。一台 Strix Halo 迷你主机就能跑到 40.1 tok/s，三步命令跑起来。",
            lead=[
                "想要一个随时在线、数据不出门的本地助手，8B 模型是最常见的选择：够聪明，又不挑硬件。",
                "我们在两台很不一样的机器上跑了 Qwen3-8B：一台是 Strix Halo 迷你主机（Radeon 8060S 集成显卡），一台是工作站显卡 Radeon PRO W7900。Q4_K_M 量化下，单请求分别是 40.1 和 87.2 tok/s。",
            ],
            sections=[
                ("40.1 tok/s 是什么体验", [
                    "单请求 40.1 tok/s，意味着回答出字的速度明显快过人阅读的速度，日常对话、总结文档都不会觉得在等。",
                    "Strix Halo 的显存来自系统内存，和 CPU 共用。它的优势是容量，不是带宽：同样的 Q4_K_M，W7900 快了 2.2 倍。如果你要的是一台安静、省电、装得下更大模型的盒子，Strix Halo 更合适；要的是 8B 级别的极致速度，独立显卡更快。",
                ]),
            ],
            tips=["Strix Halo 上 BF16 只有 11.9 tok/s，8B 模型建议直接用 Q4_K_M 或 Q8_0（25.5 tok/s）。"],
        ),
        en=dict(
            title="Run Qwen3-8B on an AMD mini PC: 40.1 tok/s on Strix Halo, 87.2 on W7900",
            excerpt="8B is the go-to size for a local assistant. A Strix Halo mini PC runs it at 40.1 tok/s; three commands get you there.",
            lead=[
                "If you want an always-on assistant that keeps your data at home, an 8B model is the usual pick: capable, and easy on hardware.",
                "We ran Qwen3-8B on two very different machines: a Strix Halo mini PC with its integrated Radeon 8060S, and a Radeon PRO W7900 workstation card. With Q4_K_M, a single request decodes at 40.1 and 87.2 tok/s.",
            ],
            sections=[
                ("What 40.1 tok/s feels like", [
                    "At 40.1 tok/s the answer appears faster than you can read it. Chat and document summaries never feel like waiting.",
                    "Strix Halo's graphics memory is system memory shared with the CPU. Its strength is capacity, not bandwidth: with the same Q4_K_M weights, W7900 is 2.2x faster. For a quiet, low-power box that can also hold larger models, pick Strix Halo; for top speed at 8B, a discrete card wins.",
                ]),
            ],
            tips=["BF16 on Strix Halo gives only 11.9 tok/s. For an 8B model use Q4_K_M, or Q8_0 at 25.5 tok/s."],
        ),
    ),
    "qwen3-14b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="data",
        zh=dict(
            title="Qwen3-14B 别直接上 BF16：在 Strix Halo 上，Q4_K_M 快 3 倍",
            excerpt="同一台 Strix Halo，BF16 单请求 7.7 tok/s，Q4_K_M 23.5 tok/s。14B 模型选对量化格式，比换硬件还管用。",
            lead=[
                "很多人下载模型的第一反应是“要原版、不要量化”。在 14B 这个尺寸上，这个习惯代价很大。",
                "在 Strix Halo 上，Qwen3-14B 的 BF16 单请求只有 7.7 tok/s，换成 Q4_K_M 是 23.5 tok/s，快了 3 倍。下面是三种格式的对比和部署命令。",
            ],
            sections=[
                ("为什么量化快这么多", [
                    "生成每个 token，都要把全部权重从显存里读一遍。BF16 每个参数 2 字节，Q8_0 大约 1 字节，Q4_K_M 大约半个字节，读的数据越少，出字越快。",
                    "Strix Halo 的三个数字正好排成一条线：BF16 7.7，Q8_0 14.4，Q4_K_M 23.5 tok/s。W7900 上也是一样的规律：BF16 24.2，Q8_0 39.0，Q4_K_M 55.7。",
                    "质量上，Q4_K_M 有轻微损失，Q8_0 几乎无损。追求速度用 Q4_K_M，追求稳妥用 Q8_0，BF16 只在需要做对照实验时才用。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="Don't run Qwen3-14B in BF16: on Strix Halo, Q4_K_M is 3x faster",
            excerpt="On the same Strix Halo, BF16 decodes 7.7 tok/s and Q4_K_M 23.5. At 14B, choosing the right quantization matters more than new hardware.",
            lead=[
                "Many people reach for the original weights by reflex. At 14B that habit is expensive.",
                "On Strix Halo, Qwen3-14B in BF16 decodes a single request at 7.7 tok/s. Q4_K_M does 23.5 tok/s, 3x faster. Below are the three formats side by side and the commands to deploy.",
            ],
            sections=[
                ("Why quantization is so much faster", [
                    "Every generated token reads all the weights from memory once. BF16 is 2 bytes per parameter, Q8_0 about 1, Q4_K_M about half a byte. Fewer bytes, faster tokens.",
                    "The three Strix Halo numbers line up: BF16 7.7, Q8_0 14.4, Q4_K_M 23.5 tok/s. W7900 follows the same pattern: BF16 24.2, Q8_0 39.0, Q4_K_M 55.7.",
                    "Q4_K_M loses a little quality; Q8_0 is close to lossless. Use Q4_K_M for speed, Q8_0 to play safe, and BF16 only as a reference.",
                ]),
            ],
            tips=[],
        ),
    ),
    "qwen3-32b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        alt=[("w7900", "llama.cpp", "Q4_K_M", 1)],
        layout="compare",
        zh=dict(
            title="Qwen3-32B 本地部署：128GB 的迷你主机，还是 48GB 的专业卡？",
            excerpt="32B 稠密模型对显存和带宽都有要求。Strix Halo 装得下 BF16，W7900 单卡跑 Q4_K_M 快一倍多。实测数据和两套部署命令。",
            lead=[
                "32B 是很多人心中“本地能跑的最强稠密模型”。它的权重在 BF16 下要占 60 GB 以上，一般的游戏卡装不下。",
                "AMD 这边有两条路：Strix Halo 迷你主机最多 128GB 统一内存，BF16 也能装下；Radeon PRO W7900 有 48GB 显存，单卡装 Q8_0。我们把两条路都跑了一遍。",
            ],
            sections=[
                ("容量和速度，二选一", [
                    "Strix Halo 能单机跑 BF16，但只有 3.4 tok/s，更适合当质量对照。实用的是 Q4_K_M：10.8 tok/s，32 并发总吞吐 132 tok/s。",
                    "W7900 单卡 Q4_K_M 单请求 26.3 tok/s，Q8_0 18.5 tok/s。要跑 BF16 得两张 W7900，单请求 11.0 tok/s。",
                    "怎么选：一个人用、看重速度，选 W7900；想一台机器同时放下多个模型、或者需要 BF16 原版，选 Strix Halo。",
                ]),
            ],
            tips=["W7900 上 Q4_K_M 的首 token 时延是 851 ms，比小模型长，属于 32B 稠密模型的正常现象。"],
        ),
        en=dict(
            title="Qwen3-32B at home: a 128GB mini PC or a 48GB pro card?",
            excerpt="A dense 32B model needs both memory and bandwidth. Strix Halo fits BF16; one W7900 runs Q4_K_M more than twice as fast. Measurements and both deployments.",
            lead=[
                "32B is many people's idea of the strongest dense model you can run locally. In BF16 its weights take more than 60 GB, beyond most gaming cards.",
                "AMD offers two routes: a Strix Halo mini PC with up to 128GB of unified memory, enough for BF16, and a Radeon PRO W7900 with 48GB, enough for Q8_0 on one card. We ran both.",
            ],
            sections=[
                ("Capacity or speed", [
                    "Strix Halo can hold BF16 on its own, but it decodes only 3.4 tok/s, so treat it as a quality reference. Q4_K_M is the practical choice: 10.8 tok/s, and 132 tok/s in total at 32 requests.",
                    "One W7900 with Q4_K_M decodes 26.3 tok/s for one request, and Q8_0 18.5. BF16 needs two W7900 cards and gives 11.0 tok/s.",
                    "Pick W7900 for one fast user. Pick Strix Halo to keep several models loaded on one machine, or when you need the original BF16 weights.",
                ]),
            ],
            tips=["Time to first token for Q4_K_M on W7900 is 851 ms, longer than small models and normal for a dense 32B."],
        ),
    ),
    "qwen3-30b-a3b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="data",
        zh=dict(
            title="30B 的模型，8B 的速度：Qwen3-30B-A3B 在 Strix Halo 上跑出 67.5 tok/s",
            excerpt="MoE 模型每个 token 只算约 3B 参数。在 Strix Halo 上，它比 Qwen3-8B 还快。实测、原理和部署命令。",
            lead=[
                "参数越多越慢，这条常识在混合专家（MoE）模型上不成立。",
                "Qwen3-30B-A3B 总参数 30B，但每个 token 只激活约 3B。在 Strix Halo 上，它的 Q4_K_M 单请求 67.5 tok/s，比同一台机器上的 Qwen3-8B（40.1 tok/s）还快。",
            ],
            sections=[
                ("为什么 MoE 适合 Strix Halo", [
                    "MoE 把模型拆成很多“专家”，每个 token 只走其中几个。显存里要放下全部 30B 参数，但每一步只读其中一小部分。",
                    "这正好对上 Strix Halo 的特点：内存容量大、带宽一般。容量负责装下整个模型，每步只读约 3B 参数，带宽也就够用了。",
                    "W7900 上同样明显：Q4_K_M 单请求 100.5 tok/s。两张 W7900 跑 vLLM BF16，32 并发总吞吐 749 tok/s，是这个模型在榜单上的最高并发成绩。",
                ]),
                ("YaRN 长上下文的代价", [
                    "榜单里的 BF16+YaRN 是同一份权重，打开了 YaRN 长上下文缩放。在短提示词下它有代价：W7900 双卡 vLLM，单请求 84.6 对 93.8 tok/s，32 并发 397 对 749。不需要超长上下文就别开。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="A 30B model at 8B speed: Qwen3-30B-A3B runs 67.5 tok/s on Strix Halo",
            excerpt="A mixture-of-experts model computes only about 3B parameters per token. On Strix Halo it beats Qwen3-8B. Numbers, the reason, and the commands.",
            lead=[
                "More parameters means slower: that rule breaks for mixture-of-experts (MoE) models.",
                "Qwen3-30B-A3B has 30B parameters in total but activates about 3B per token. On Strix Halo its Q4_K_M build decodes 67.5 tok/s for one request, faster than Qwen3-8B on the same machine (40.1 tok/s).",
            ],
            sections=[
                ("Why MoE suits Strix Halo", [
                    "An MoE model is split into many experts, and each token goes through a few of them. All 30B parameters must be in memory, but each step reads only a small part.",
                    "That matches Strix Halo: large memory, moderate bandwidth. Capacity holds the whole model; each step reads about 3B parameters, which the bandwidth can keep up with.",
                    "W7900 shows the same: 100.5 tok/s for one request with Q4_K_M. Two W7900 cards with vLLM BF16 reach 749 tok/s at 32 requests, this model's highest concurrent result on the board.",
                ]),
                ("The cost of YaRN long context", [
                    "BF16+YaRN on the board is the same weights with YaRN scaling switched on. With short prompts it costs speed: on two W7900 cards with vLLM, 84.6 against 93.8 tok/s for one request, 397 against 749 at 32. Leave it off unless you need very long context.",
                ]),
            ],
            tips=[],
        ),
    ),
    "qwen3.6-27b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        alt=[("r9700", "vLLM", "BF16", 4)],
        layout="tutorial",
        zh=dict(
            title="Qwen3.6-27B 上 R9700：一张卡 24.1 tok/s，四张卡 vLLM 并发到 324",
            excerpt="一张 R9700 用 llama.cpp 跑 Q4_K_M，四张 R9700 用 vLLM 张量并行跑 BF16。从单卡到四卡，两套命令都在这里。",
            lead=[
                "27B 稠密模型是工作站显卡最常见的负载。一张 32GB 的 R9700 装得下它的 4 比特版本，要跑原版 BF16 就得多卡。",
                "我们给出两套方案：一张 R9700 跑 Q4_K_M，单请求 24.1 tok/s；四张 R9700 跑 vLLM BF16，单请求 34.1 tok/s，32 并发总吞吐 324 tok/s。",
            ],
            sections=[
                ("加卡，选 vLLM 还是 llama.cpp", [
                    "llama.cpp 多卡是按层切分，模型放得下，但同一时刻只有一张卡在算，速度不会叠加：两张 R9700 跑 BF16 只有 10.6 tok/s。",
                    "vLLM 用张量并行，每一层都分到所有卡上一起算。同样两张卡跑 BF16，单请求 20.8 tok/s；四张卡 34.1 tok/s，比单卡 Q4_K_M 还快。",
                    "结论：一张卡就用 llama.cpp 的 4 比特；有多张卡，就上 vLLM。",
                ]),
            ],
            tips=[
                "W7900 单卡 llama.cpp Q4_K_M 的 32 并发总吞吐是 84 tok/s；要更高并发请用 vLLM（W7900 双卡 BF16 32 并发 244 tok/s）。",
                "Quark W8A8-INT8 在 R9700 双卡上单请求只有 11.8 tok/s，不如 BF16，不推荐。",
            ],
        ),
        en=dict(
            title="Qwen3.6-27B on R9700: 24.1 tok/s on one card, 324 tok/s with four cards and vLLM",
            excerpt="One R9700 runs Q4_K_M in llama.cpp; four run BF16 with vLLM tensor parallelism. Commands for both, from one card to four.",
            lead=[
                "A dense 27B model is the bread-and-butter workload for workstation cards. One 32GB R9700 holds its 4-bit build; the original BF16 needs several cards.",
                "Two setups: one R9700 with Q4_K_M at 24.1 tok/s for one request, and four R9700 cards with vLLM BF16 at 34.1 tok/s for one request and 324 tok/s in total at 32.",
            ],
            sections=[
                ("More cards: vLLM or llama.cpp", [
                    "llama.cpp splits layers across cards. The model fits, but only one card works at a time, so speed does not add up: two R9700 cards with BF16 give 10.6 tok/s.",
                    "vLLM uses tensor parallelism, so every layer runs on all cards at once. On the same two cards BF16 decodes 20.8 tok/s; on four, 34.1 tok/s, faster than one card with Q4_K_M.",
                    "With one card, use llama.cpp at 4 bits. With several, use vLLM.",
                ]),
            ],
            tips=[
                "On one W7900, llama.cpp Q4_K_M reaches 84 tok/s in total at 32 requests. For more concurrency use vLLM: two W7900 cards with BF16 give 244 tok/s at 32.",
                "Quark W8A8-INT8 on two R9700 cards gives 11.8 tok/s for one request, slower than BF16. Not recommended.",
            ],
        ),
    ),
    "qwen3.6-35b-a3b": dict(
        hero=("r9700", "vLLM", "AWQ-4bit", 1),
        alt=[("r9700", "llama.cpp", "UD-Q4_K_M", 1)],
        layout="compare",
        zh=dict(
            title="Qwen3.6-35B-A3B 怎么部署最快？我们在三种 AMD 显卡上试了 20 种组合",
            excerpt="BF16、Q8_0、4 比特、AWQ、Quark、AutoRound，vLLM 和 llama.cpp，单卡到四卡。20 组实测后的选型建议和一键命令。",
            lead=[
                "Qwen3.6-35B-A3B 是榜单上部署组合最多的模型：两个引擎、六种权重格式、一到四张卡，一共 20 组实测。",
                "如果你只有一张 R9700，答案是 vLLM 跑 AWQ-4bit：单请求 69.7 tok/s，32 并发 384 tok/s，两项都比同卡 llama.cpp 好。其他硬件的答案不同，下面逐一说。",
            ],
            sections=[
                ("每张卡的最佳组合", [
                    "R9700 单卡：vLLM AWQ-4bit，69.7 tok/s，32 并发 384。四张卡跑 vLLM BF16，单请求 96.8 tok/s，32 并发 827，是这个模型的最高成绩。",
                    "Strix Halo：单人用选 llama.cpp UD-Q4_K_M，49.3 tok/s；要并发选 vLLM 的 Intel INT4 AutoRound，32 并发 189。",
                    "W7900 单卡：单人用选 llama.cpp UD-Q4_K_M，76.3 tok/s；要并发选 vLLM Quark W8A8-INT8，32 并发 444（AWQ-4bit 是 373）。两张卡跑 vLLM BF16，单请求 90.2 tok/s，32 并发 656。",
                ]),
            ],
            tips=["AWQ 和 Quark 权重来自第三方量化，不是 Qwen 官方发布，下载前看一下模型卡。"],
        ),
        en=dict(
            title="What's the fastest way to deploy Qwen3.6-35B-A3B? We tried 20 setups on three AMD GPUs",
            excerpt="BF16, Q8_0, 4-bit, AWQ, Quark, AutoRound; vLLM and llama.cpp; one to four cards. What to pick after 20 measured setups, with commands.",
            lead=[
                "Qwen3.6-35B-A3B has more measured setups than any other model on the board: two engines, six weight formats, one to four cards, 20 in all.",
                "With one R9700, the answer is vLLM with AWQ-4bit: 69.7 tok/s for one request and 384 tok/s at 32, both better than llama.cpp on the same card. Other hardware has other answers, below.",
            ],
            sections=[
                ("The best setup on each card", [
                    "One R9700: vLLM AWQ-4bit, 69.7 tok/s, 384 at 32. Four cards with vLLM BF16 reach 96.8 tok/s for one request and 827 at 32, the best result for this model.",
                    "Strix Halo: for one user, llama.cpp UD-Q4_K_M at 49.3 tok/s; for concurrency, vLLM with Intel's INT4 AutoRound, 189 at 32.",
                    "One W7900: for one user, llama.cpp UD-Q4_K_M at 76.3 tok/s; for concurrency, vLLM Quark W8A8-INT8 with 444 at 32 (AWQ-4bit gives 373). Two cards with vLLM BF16 reach 90.2 tok/s for one request and 656 at 32.",
                ]),
            ],
            tips=["The AWQ and Quark weights are third-party quantizations, not official Qwen releases. Read the model card before downloading."],
        ),
    ),
    "qwen3.8-27b": dict(
        hero=("r9700", "llama.cpp", "UD-Q4_K_M", 1),
        alt=[("r9700", "vLLM", "BF16", 4)],
        layout="tutorial",
        zh=dict(
            title="Qwen3.8-27B 首测：R9700 单卡 23.0 tok/s，四卡 vLLM 32 并发 330",
            excerpt="Qwen3.8 的 27B 稠密模型，11 月在三种 AMD 显卡上首测。单卡怎么跑、多卡怎么跑、哪张卡更合适。",
            lead=[
                "Qwen3.8-27B 是 11 月新加入榜单的模型。我们第一时间在 R9700、W7900 和 Strix Halo 上做了完整测试。",
                "一张 R9700 跑 UD-Q4_K_M，单请求 23.0 tok/s；四张 R9700 跑 vLLM BF16，32 并发总吞吐 330 tok/s。W7900 凭 48GB 显存，单卡就能装下 Q8_0。",
            ],
            sections=[
                ("48GB 的单卡优势", [
                    "R9700 有 32GB 显存，Q8_0 要两张卡，单请求 15.3 tok/s。W7900 一张卡就装下 Q8_0，单请求 20.1 tok/s，32 并发 85 tok/s。",
                    "4 比特版本两张卡都只要一张：W7900 27.6 tok/s，R9700 23.0 tok/s。",
                    "和上一代 Qwen3.6-27B 比，同一张 R9700 上 4 比特的速度基本持平（24.1 对 23.0），升级模型不需要换硬件。",
                ]),
            ],
            tips=["Strix Halo 上的首 token 时延在 1.8 到 2.4 秒之间，27B 稠密模型在 Strix Halo 上更适合不着急的批处理任务。"],
        ),
        en=dict(
            title="First look at Qwen3.8-27B: 23.0 tok/s on one R9700, 330 tok/s at 32 on four with vLLM",
            excerpt="Qwen3.8's dense 27B, measured on three AMD GPUs in November. How to run it on one card or several, and which card fits.",
            lead=[
                "Qwen3.8-27B joined the board in November, and we measured it right away on R9700, W7900 and Strix Halo.",
                "One R9700 with UD-Q4_K_M decodes 23.0 tok/s for one request; four R9700 cards with vLLM BF16 deliver 330 tok/s in total at 32. With 48GB, a single W7900 holds Q8_0.",
            ],
            sections=[
                ("The 48GB single-card advantage", [
                    "R9700 has 32GB, so Q8_0 needs two cards and gives 15.3 tok/s. One W7900 holds Q8_0 and gives 20.1 tok/s for one request and 85 tok/s at 32.",
                    "The 4-bit build fits on one card of either: 27.6 tok/s on W7900, 23.0 on R9700.",
                    "Against Qwen3.6-27B, 4-bit speed on the same R9700 is about the same (24.1 against 23.0). Upgrading the model does not mean upgrading the card.",
                ]),
            ],
            tips=["On Strix Halo, time to first token is 1.8 to 2.4 seconds. A dense 27B on Strix Halo suits batch work that is not in a hurry."],
        ),
    ),
    "qwen3.8-flash-next": dict(
        hero=("strix", "llama.cpp", "UD-Q3_K_XL", 1),
        alt=[("r9700", "llama.cpp", "UD-Q3_K_XL", 4)],
        layout="data",
        zh=dict(
            title="Qwen3.8-Flash-Next：四张显卡 30.4 tok/s，一台 Strix Halo 迷你主机 20.8",
            excerpt="大型 MoE 模型，一般要多卡。Strix Halo 靠 128GB 统一内存单机跑起来，单请求 20.8 tok/s。",
            lead=[
                "Qwen3.8-Flash-Next 是一个大型 MoE 模型。我们在独立显卡上测它时，R9700 和 W7900 都用了四张卡。",
                "Strix Halo 是另一条路：一台迷你主机、一块集成显卡，单请求 20.8 tok/s。四张 R9700 是 30.4 tok/s，快一些，但成本、功耗和体积都不在一个量级。",
            ],
            sections=[
                ("一台盒子对四张卡", [
                    "单请求：R9700 四卡 30.4，W7900 四卡 30.3，Strix Halo 20.8 tok/s。",
                    "并发：W7900 四卡 32 并发 111 tok/s，R9700 四卡 63，Strix Halo 48。要同时服务多人，W7900 四卡更稳。",
                    "W7900 上还测了 UD-Q4_K_XL：单请求 29.0 tok/s，和 3 比特几乎一样。4 比特量化损失更小，显存够就选它。",
                ]),
            ],
            tips=["Strix Halo 的配方用 --load-mode none 加载这个模型，照抄即可。"],
        ),
        en=dict(
            title="Qwen3.8-Flash-Next: 30.4 tok/s on four GPUs, 20.8 on one Strix Halo mini PC",
            excerpt="A large MoE model usually needs several cards. Strix Halo runs it on one box with 128GB of unified memory, at 20.8 tok/s for one request.",
            lead=[
                "Qwen3.8-Flash-Next is a large MoE model. On discrete cards we measured it with four R9700 or four W7900 cards.",
                "Strix Halo is the other route: one mini PC, one integrated GPU, 20.8 tok/s for one request. Four R9700 cards give 30.4 tok/s, a bit faster, at a very different cost, power draw and size.",
            ],
            sections=[
                ("One box against four cards", [
                    "One request: four R9700 30.4, four W7900 30.3, Strix Halo 20.8 tok/s.",
                    "Concurrency: four W7900 cards give 111 tok/s at 32, four R9700 63, Strix Halo 48. For many users at once, four W7900 cards hold up best.",
                    "W7900 also ran UD-Q4_K_XL: 29.0 tok/s for one request, almost the same as 3-bit. 4-bit loses less to quantization, so pick it if memory allows.",
                ]),
            ],
            tips=["The Strix Halo recipe loads this model with --load-mode none; keep it."],
        ),
    ),
    "diffusiongemma-26b-a4b": dict(
        hero=("strix", "vLLM (main)", "AWQ-INT4", 1),
        layout="data",
        zh=dict(
            title="在 AMD Radeon 上跑扩散语言模型：DiffusionGemma 实测与部署",
            excerpt="不是一个字一个字地生成，而是整块反复细化。DiffusionGemma 在 vLLM main 分支上跑通，首 token 慢、整体快，实测告诉你为什么。",
            lead=[
                "大多数语言模型一个 token 接一个 token 地生成。DiffusionGemma 不一样：它每次对一整块 token 反复细化，像图像扩散模型去噪一样。",
                "我们在 Strix Halo 和 W7900 上用 vLLM 的 main 分支跑通了它。W7900 上单请求 31.2 tok/s，但第一个 token 要等 4.1 秒。",
            ],
            sections=[
                ("为什么首 token 这么慢", [
                    "流式输出要等第一整块细化完成才能吐出第一个 token，所以首 token 时延远高于普通模型。之后整块一起出来，平均速度并不慢。",
                    "适合的场景是一次生成一段完整内容，比如改写、摘要；不适合需要“秒回”的对话。",
                ]),
                ("并发为什么上不去", [
                    "并发超过 4 之后，总吞吐几乎不再增长：W7900 上 32 并发只有 35 tok/s。W7900 的服务启动时最大序列数设成了 4，这是当前实现下的保守配置。",
                ]),
            ],
            tips=["需要 vLLM main 分支，正式版 vLLM 镜像跑不了。两台设备测试用的镜像都已在 InferStation 公开，下方命令用的就是测试时的镜像。"],
        ),
        en=dict(
            title="Running a diffusion language model on AMD Radeon: DiffusionGemma measured and deployed",
            excerpt="It refines a whole block at a time instead of one token after another. DiffusionGemma runs on vLLM's main branch: slow first token, fine overall speed, and why.",
            lead=[
                "Most language models emit one token after another. DiffusionGemma refines a whole block of tokens over several passes, much like an image diffusion model removes noise.",
                "We ran it on Strix Halo and W7900 with vLLM's main branch. On W7900 a single request decodes 31.2 tok/s, but the first token takes 4.1 seconds.",
            ],
            sections=[
                ("Why the first token is slow", [
                    "Streaming has to wait for the first block to finish refining before any token appears, so time to first token is far above a normal model. After that a whole block arrives at once, and average speed is fine.",
                    "It suits generating a complete passage, such as rewriting or summarizing, not chat that must answer instantly.",
                ]),
                ("Why concurrency stalls", [
                    "Beyond 4 concurrent requests, total throughput barely grows: 35 tok/s at 32 on W7900. The W7900 server was started with at most 4 sequences, a conservative setting for the current implementation.",
                ]),
            ],
            tips=["It needs vLLM's main branch; release vLLM images cannot run it. The images we measured on both devices are public on InferStation; the command below uses the exact image we tested."],
        ),
    ),
    "gemma-4-26b-a4b": dict(
        hero=("strix", "vLLM", "AWQ-4bit", 1),
        alt=[("strix", "llama.cpp", "UD-Q4_K_M", 1)],
        layout="compare",
        zh=dict(
            title="Gemma 4 26B 上 Strix Halo：一个人用选 llama.cpp 还是 vLLM？",
            excerpt="单请求打平（42.5 对 43.3 tok/s），32 并发 vLLM 是 llama.cpp 的 2.1 倍。Google Gemma 4 MoE 在 AMD 迷你主机上的选型和部署。",
            lead=[
                "Gemma 4 26B-A4B 是 Google 的 MoE 模型，每个 token 激活约 4B 参数，很适合 Strix Halo 这类大内存机器。",
                "在 Strix Halo 上，vLLM 跑 AWQ-4bit 和 llama.cpp 跑 UD-Q4_K_M，单请求几乎打平：42.5 对 43.3 tok/s。差别在并发：32 个请求时，vLLM 434 tok/s，llama.cpp 207。",
            ],
            sections=[
                ("怎么选", [
                    "只给自己用：两个都行，llama.cpp 部署更简单，GGUF 文件一个就够。",
                    "要给几个人或者几个 Agent 同时用：选 vLLM，并发吞吐是 llama.cpp 的 2.1 倍。",
                    "W7900 上差距更大：vLLM AWQ-4bit 单卡单请求 96.5 tok/s，32 并发 454；llama.cpp UD-Q4_K_M 是 68.1 和 261。",
                ]),
            ],
            tips=["vLLM 的配方用 --max-model-len 2304，只够测试用的 512 输入加 128 输出。日常使用请按需调大，显存会相应增加。"],
        ),
        en=dict(
            title="Gemma 4 26B on Strix Halo: llama.cpp or vLLM for one user?",
            excerpt="Even for one request (42.5 vs 43.3 tok/s); at 32 requests vLLM does 2.1x llama.cpp. Choosing and deploying Google's Gemma 4 MoE on an AMD mini PC.",
            lead=[
                "Gemma 4 26B-A4B is Google's MoE model, with about 4B parameters active per token, a good fit for a large-memory machine like Strix Halo.",
                "On Strix Halo, vLLM with AWQ-4bit and llama.cpp with UD-Q4_K_M are even for one request: 42.5 against 43.3 tok/s. The difference is concurrency: at 32 requests vLLM gives 434 tok/s, llama.cpp 207.",
            ],
            sections=[
                ("Which to pick", [
                    "Just for you: either works, and llama.cpp is simpler, one GGUF file.",
                    "For several people or agents at once: vLLM, with 2.1x the concurrent throughput.",
                    "The gap is wider on W7900: vLLM AWQ-4bit on one card gives 96.5 tok/s for one request and 454 at 32; llama.cpp UD-Q4_K_M gives 68.1 and 261.",
                ]),
            ],
            tips=["The vLLM recipe uses --max-model-len 2304, just enough for the 512-token prompt and 128 output tokens of the test. Raise it for real use; memory use grows with it."],
        ),
    ),
    "gemma-4-31b": dict(
        hero=("strix", "vLLM", "Quark-W8A8-INT8", 1),
        layout="tutorial",
        zh=dict(
            title="Gemma 4 31B 稠密版：用 AMD Quark 8 比特量化，在 Radeon 上跑起来",
            excerpt="Google Gemma 4 的 31B 稠密模型，用 AMD Quark W8A8-INT8 量化后在 vLLM 上运行。W7900 单卡 12.9 tok/s。",
            lead=[
                "Gemma 4 31B 是 Google 这一代的稠密旗舰。我们用的是 AMD Quark 工具量化的 W8A8-INT8 版本，权重和激活都是 8 比特，跑在 vLLM 上。",
                "W7900 单卡单请求 12.9 tok/s，32 并发 85 tok/s；Strix Halo 单请求 6.3 tok/s，32 并发 78 tok/s。",
            ],
            sections=[
                ("Strix Halo 适合批处理", [
                    "Strix Halo 单请求 6.3 tok/s 偏慢，但 32 并发的总吞吐 78 tok/s 和 W7900 相当。用它来跑批量任务，比如批量打标签、批量摘要，是合适的。",
                    "需要交互式对话，选 W7900；或者换成 Gemma 4 26B-A4B 这个 MoE 版本，同一台 Strix Halo 上单请求能到 42.5 tok/s。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="Gemma 4 31B dense: running AMD Quark 8-bit weights on Radeon",
            excerpt="Google's dense 31B Gemma 4, quantized with AMD Quark to W8A8-INT8 and served by vLLM. 12.9 tok/s on one W7900.",
            lead=[
                "Gemma 4 31B is the dense flagship of Google's current generation. We use a W8A8-INT8 build made with AMD's Quark tool, with 8-bit weights and activations, served by vLLM.",
                "One W7900 decodes 12.9 tok/s for one request and 85 tok/s at 32; Strix Halo gives 6.3 tok/s for one request and 78 at 32.",
            ],
            sections=[
                ("Strix Halo suits batch work", [
                    "6.3 tok/s for one request on Strix Halo is slow, but its 78 tok/s at 32 matches W7900. It is a fine box for batch jobs such as bulk tagging or summaries.",
                    "For interactive chat, use W7900, or switch to the MoE Gemma 4 26B-A4B, which reaches 42.5 tok/s for one request on the same Strix Halo.",
                ]),
            ],
            tips=[],
        ),
    ),
    "llama-3.1-8b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="Llama 3.1 8B 在 AMD Radeon 上：用这个老基准，量一量新模型",
            excerpt="Llama 3.1 8B 是本地部署的“标准尺”。Strix Halo 41.1 tok/s，W7900 92.5 tok/s，拿它和新一代 8B 模型对比一下。",
            lead=[
                "Llama 3.1 8B 已经不新了，但它仍是最常被拿来比较的本地模型。几乎每个推理引擎、每块显卡的评测都会测它。",
                "所以我们也测了它，当作一把尺子。Q4_K_M 下，Strix Halo 单请求 41.1 tok/s，W7900 92.5 tok/s。",
            ],
            sections=[
                ("用同一把尺子量新模型", [
                    "同样在 Strix Halo、同样 Q4_K_M：Llama 3.1 8B 41.1 tok/s，Qwen3-8B 40.1，Granite 4.2 8B 33.4。尺寸相近的稠密模型，速度也相近，差别主要来自结构细节。",
                    "并发上，Llama 3.1 8B 在 Strix Halo 上 32 并发能到 454 tok/s，是这一档里最高的。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="Llama 3.1 8B on AMD Radeon: an old benchmark to measure new models against",
            excerpt="Llama 3.1 8B is the yardstick of local inference. 41.1 tok/s on Strix Halo, 92.5 on W7900, and how newer 8B models compare.",
            lead=[
                "Llama 3.1 8B is no longer new, yet it is still the local model everyone compares against. Almost every engine and GPU review measures it.",
                "So we measured it too, as a yardstick. With Q4_K_M, one request decodes 41.1 tok/s on Strix Halo and 92.5 on W7900.",
            ],
            sections=[
                ("Measuring new models with the same stick", [
                    "Same Strix Halo, same Q4_K_M: Llama 3.1 8B 41.1 tok/s, Qwen3-8B 40.1, Granite 4.2 8B 33.4. Dense models of similar size run at similar speed; the differences come from architecture details.",
                    "Under load, Llama 3.1 8B reaches 454 tok/s at 32 requests on Strix Halo, the highest in this class.",
                ]),
            ],
            tips=[],
        ),
    ),
    "granite-4.2-8b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="IBM Granite 4.2 8B 上 R9700：单卡 78.2 tok/s，企业模型本地跑",
            excerpt="IBM 的 Granite 4.2 8B，在一张 R9700 上 Q4_K_M 单请求 78.2 tok/s。三步部署，外加一个反常识的量化结果。",
            lead=[
                "Granite 是 IBM 面向企业场景的开源模型系列，许可宽松，适合放进公司内网自己跑。",
                "一张 R9700 跑 Granite 4.2 8B 的 Q4_K_M，单请求 78.2 tok/s，32 并发 351 tok/s。W7900 几乎一样快，76.6 tok/s。",
            ],
            sections=[
                ("一个反常识的数字", [
                    "在 R9700 上，Q8_0 的 32 并发总吞吐只有 185 tok/s，反而低于 BF16 的 303。首 token 时延也是 Q8_0 最长，550 ms。",
                    "所以在这张卡上，要么用 Q4_K_M 追求速度，要么直接用 BF16，中间的 Q8_0 不划算。W7900 上没有这个现象，Q8_0 32 并发 295 tok/s。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="IBM Granite 4.2 8B on R9700: 78.2 tok/s on one card, an enterprise model at home",
            excerpt="IBM's Granite 4.2 8B with Q4_K_M decodes 78.2 tok/s on one R9700. Three steps to deploy, plus one counter-intuitive quantization result.",
            lead=[
                "Granite is IBM's open model family for enterprise use, with a permissive license that suits running inside a company network.",
                "One R9700 runs Granite 4.2 8B Q4_K_M at 78.2 tok/s for one request and 351 tok/s at 32. W7900 is nearly as fast, at 76.6 tok/s.",
            ],
            sections=[
                ("A counter-intuitive number", [
                    "On R9700, Q8_0 reaches only 185 tok/s in total at 32 requests, below BF16's 303. Q8_0 also has the longest time to first token, 550 ms.",
                    "On this card, use Q4_K_M for speed or BF16 outright; Q8_0 in between does not pay. W7900 does not show this: Q8_0 gives 295 tok/s at 32.",
                ]),
            ],
            tips=[],
        ),
    ),
    "granite-4.2-30b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        layout="data",
        zh=dict(
            title="Granite 4.2 30B：四张 R9700 跑 BF16，不如一张卡跑 Q4_K_M",
            excerpt="BF16 四卡单请求 9.7 tok/s，Q4_K_M 单卡 26.7 tok/s，快 2.8 倍。显卡不是越多越快，先选对量化。",
            lead=[
                "“卡多力量大”是个常见误解。Granite 4.2 30B 给了一个很直观的反例。",
                "四张 R9700 跑 BF16，单请求 9.7 tok/s；一张 R9700 跑 Q4_K_M，26.7 tok/s，快 2.8 倍，还省下三张卡。",
            ],
            sections=[
                ("为什么卡多反而慢", [
                    "llama.cpp 多卡是按层切分：模型被分成四段，每段放一张卡，一个 token 要依次经过四张卡。卡多解决的是“放得下”，不是“算得快”。",
                    "而单请求的速度主要取决于每个 token 要读多少权重。BF16 的权重是 Q4_K_M 的三到四倍，再多的卡也补不回来。",
                    "W7900 上也一样：单卡 Q4_K_M 27.7 tok/s，两卡 BF16 12.1 tok/s。",
                ]),
            ],
            tips=["要多卡并且速度叠加，需要 vLLM 的张量并行；这个模型目前只测了 llama.cpp。"],
        ),
        en=dict(
            title="Granite 4.2 30B: four R9700 cards in BF16 lose to one card with Q4_K_M",
            excerpt="BF16 on four cards decodes 9.7 tok/s; Q4_K_M on one card does 26.7, 2.8x faster. More GPUs are not faster; pick the right quantization first.",
            lead=[
                "More cards, more speed is a common misconception. Granite 4.2 30B is a clear counterexample.",
                "Four R9700 cards in BF16 decode 9.7 tok/s for one request. One R9700 with Q4_K_M does 26.7 tok/s, 2.8x faster, and frees three cards.",
            ],
            sections=[
                ("Why more cards are slower here", [
                    "llama.cpp splits a model by layers: four slices on four cards, and each token passes through them in turn. More cards solve fitting, not speed.",
                    "Single-request speed depends on how many weight bytes each token reads. BF16 weights are three to four times the size of Q4_K_M, and extra cards cannot make that up.",
                    "W7900 agrees: Q4_K_M on one card 27.7 tok/s, BF16 on two cards 12.1 tok/s.",
                ]),
            ],
            tips=["To add cards and add speed, you need vLLM's tensor parallelism; this model has only been measured in llama.cpp so far."],
        ),
    ),
    "lfm2.5-24b-a2b": dict(
        hero=("r9700", "llama.cpp", "UD-Q4_K_XL", 1),
        layout="tutorial",
        zh=dict(
            title="LFM2.5-24B-A2B：24B 的模型，一张 R9700 跑出 132.3 tok/s",
            excerpt="Liquid AI 的 MoE 模型每个 token 只激活约 2B 参数。R9700 单卡 132.3 tok/s，W7900 115.0，Strix Halo 77.0。",
            lead=[
                "24B 的模型能跑多快？如果是 Liquid AI 的 LFM2.5-24B-A2B，答案是比很多 4B 模型还快。",
                "它是 MoE 结构，每个 token 只激活约 2B 参数。一张 R9700 跑 UD-Q4_K_XL，单请求 132.3 tok/s，32 并发 475 tok/s，首 token 150 ms。",
            ],
            sections=[
                ("三张卡都很快", [
                    "W7900 单卡 115.0 tok/s，Strix Halo 77.0 tok/s。对 Strix Halo 来说，这是一个 24B 模型能跑出的很好成绩，日常用完全够快。",
                    "Q8_0 也只慢一点：R9700 113.6、W7900 108.7 tok/s。显存够的话，用 Q8_0 换更好的质量很划算。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="LFM2.5-24B-A2B: a 24B model at 132.3 tok/s on one R9700",
            excerpt="Liquid AI's MoE model activates only about 2B parameters per token. 132.3 tok/s on one R9700, 115.0 on W7900, 77.0 on Strix Halo.",
            lead=[
                "How fast can a 24B model run? For Liquid AI's LFM2.5-24B-A2B, faster than many 4B models.",
                "It is an MoE model that activates about 2B parameters per token. One R9700 with UD-Q4_K_XL decodes 132.3 tok/s for one request, 475 tok/s at 32, with a 150 ms first token.",
            ],
            sections=[
                ("Fast on all three", [
                    "One W7900 gives 115.0 tok/s and Strix Halo 77.0. For Strix Halo that is an excellent result for a 24B model, plenty for daily use.",
                    "Q8_0 is only a little slower: 113.6 on R9700 and 108.7 tok/s on W7900. If memory allows, Q8_0 buys better quality cheaply.",
                ]),
            ],
            tips=[],
        ),
    ),
    "lfm3-1.7b": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="LFM3-1.7B：R9700 单请求 210.1 tok/s，迷你主机上也有 124.2",
            excerpt="1.7B 的小模型适合做常驻的轻量助手和 Agent 子任务。Strix Halo 单请求 124.2 tok/s，首 token 119 ms。",
            lead=[
                "不是每个任务都需要大模型。分类、抽取、改写、Agent 里的小步骤，用 1.7B 的模型就够了，而且快得多。",
                "Liquid AI 的 LFM3-1.7B 在 R9700 上单请求 210.1 tok/s。放在一台 Strix Halo 迷你主机上常驻，也有 124.2 tok/s，首 token 119 ms。",
            ],
            sections=[
                ("一台小盒子，常驻一个快模型", [
                    "Strix Halo 跑这个模型，32 并发总吞吐 559 tok/s，足够同时支撑多个 Agent 调用。",
                    "如果你有独立显卡：R9700 32 并发 756 tok/s，W7900 748 tok/s，首 token 分别是 57 和 69 ms。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="LFM3-1.7B: 210.1 tok/s on R9700, and still 124.2 on a mini PC",
            excerpt="A 1.7B model is the right tool for an always-on helper and agent sub-tasks. 124.2 tok/s on Strix Halo with a 119 ms first token.",
            lead=[
                "Not every task needs a big model. Classification, extraction, rewriting and small agent steps run fine on 1.7B, and much faster.",
                "Liquid AI's LFM3-1.7B decodes 210.1 tok/s for one request on R9700. Left running on a Strix Halo mini PC it still gives 124.2 tok/s, with a 119 ms first token.",
            ],
            sections=[
                ("One small box, one fast resident model", [
                    "On Strix Halo this model delivers 559 tok/s in total at 32 requests, enough to serve several agents at once.",
                    "With a discrete card: 756 tok/s at 32 on R9700 and 748 on W7900, with first tokens of 57 and 69 ms.",
                ]),
            ],
            tips=[],
        ),
    ),
    "ling-3.0-flash": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        alt=[("w7900", "llama.cpp", "Q4_K_M", 2)],
        layout="data",
        zh=dict(
            title="Ling-3.0-flash：两张 W7900 比四张 R9700 还快",
            excerpt="48GB 显存的好处：两张 W7900 放得下的模型，R9700 要四张。单请求 47.0 对 44.3 tok/s，32 并发 157 对 105。",
            lead=[
                "inclusionAI 的 Ling-3.0-flash 是一个大模型，4 比特量化后，R9700 要四张卡才放得下，W7900 两张就够。",
                "结果是两张 W7900 跑得更快：单请求 47.0 对 44.3 tok/s，32 并发 157 对 105 tok/s。Strix Halo 单机也能跑，单请求 30.0 tok/s。",
            ],
            sections=[
                ("为什么卡少反而快", [
                    "llama.cpp 多卡按层切分，每个 token 要依次经过所有卡，卡之间要交接数据。分成两段比分成四段少了两次交接。",
                    "显存大的卡，用更少的卡数装下同一个模型，这是 W7900 48GB 的实际价值。",
                ]),
            ],
            tips=["Strix Halo 的配方用 --load-mode none 加载，照抄即可。"],
        ),
        en=dict(
            title="Ling-3.0-flash: two W7900 cards beat four R9700 cards",
            excerpt="The point of 48GB: a model that fits on two W7900 cards needs four R9700. 47.0 vs 44.3 tok/s for one request, 157 vs 105 at 32.",
            lead=[
                "inclusionAI's Ling-3.0-flash is a large model. At 4 bits it needs four R9700 cards, but only two W7900 cards.",
                "And two W7900 cards are faster: 47.0 against 44.3 tok/s for one request, 157 against 105 tok/s at 32. Strix Halo runs it on one box too, at 30.0 tok/s.",
            ],
            sections=[
                ("Why fewer cards are faster", [
                    "llama.cpp splits layers across cards, and each token passes through all of them, handing data from card to card. Two slices mean two fewer hand-offs than four.",
                    "Fitting the same model on fewer cards is what W7900's 48GB is really worth.",
                ]),
            ],
            tips=["The Strix Halo recipe loads it with --load-mode none; keep it."],
        ),
    ),
    "ling-3.0-tiny": dict(
        hero=("strix", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="Ling-3.0-tiny：迷你主机跑到独立显卡八成的速度",
            excerpt="inclusionAI 的小模型，Strix Halo 单请求 108.7 tok/s，R9700 135.4。小模型上，集成显卡和独显的差距很小。",
            lead=[
                "大模型拼显存带宽，Strix Halo 往往吃亏。但在小模型上，差距会缩得很小。",
                "Ling-3.0-tiny 的 Q4_K_M，在 Strix Halo 上单请求 108.7 tok/s，R9700 是 135.4，迷你主机做到了独立显卡的八成。",
            ],
            sections=[
                ("小模型上为什么差距小", [
                    "模型越小，每个 token 要读的权重越少，显存带宽不再是唯一瓶颈，调度和计算开销的占比变大。所以小模型上，各张卡的速度会靠拢。",
                    "W7900 上是 127.2 tok/s，三张卡都在 100 tok/s 以上，选哪张都够用。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="Ling-3.0-tiny: a mini PC at four fifths of a discrete GPU's speed",
            excerpt="inclusionAI's small model decodes 108.7 tok/s on Strix Halo and 135.4 on R9700. With small models, integrated and discrete GPUs are close.",
            lead=[
                "Large models are a memory-bandwidth contest, and Strix Halo often loses it. With small models the gap shrinks.",
                "Ling-3.0-tiny Q4_K_M decodes 108.7 tok/s for one request on Strix Halo and 135.4 on R9700: the mini PC reaches four fifths of the discrete card.",
            ],
            sections=[
                ("Why small models narrow the gap", [
                    "The smaller the model, the fewer weight bytes each token reads. Bandwidth stops being the only limit, and scheduling and compute overhead weigh more, so the cards converge.",
                    "W7900 gives 127.2 tok/s. All three cards are above 100 tok/s; any of them will do.",
                ]),
            ],
            tips=[],
        ),
    ),
    "mimo-v2.6-distill-qwen-9b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="小米 MiMo-V2.6 蒸馏 9B：R9700 和 W7900 跑出几乎一样的 71 tok/s 档",
            excerpt="小米把 MiMo-V2.6 蒸馏进 9B 的 Qwen 模型。R9700 单请求 71.7 tok/s，W7900 71.5，三步部署。",
            lead=[
                "小米把 MiMo-V2.6 的能力蒸馏进了一个 9B 的 Qwen 模型，体量刚好适合单张消费级或工作站显卡。",
                "实测 Q4_K_M：R9700 单请求 71.7 tok/s，W7900 71.5 tok/s，两张卡几乎打平；Strix Halo 是 31.8 tok/s。",
            ],
            sections=[
                ("新卡和老卡打平", [
                    "R9700 是 RDNA 4 新卡，W7900 是 RDNA 3 工作站卡。在这个 9B 模型上，两者单请求是 71.7 对 71.5 tok/s，W7900 的 32 并发还略高（232 对 225）。",
                    "如果你手上已经有 W7900，不用为这个尺寸的模型换卡。",
                ]),
            ],
            tips=["R9700 上 Q8_0 的首 token 时延 523 ms，比 Q4_K_M 的 267 ms 慢一倍，对话场景优先用 Q4_K_M。"],
        ),
        en=dict(
            title="Xiaomi MiMo-V2.6 distilled 9B: R9700 and W7900 both land at about 71 tok/s",
            excerpt="Xiaomi distilled MiMo-V2.6 into a 9B Qwen model. 71.7 tok/s on R9700, 71.5 on W7900, deployed in three steps.",
            lead=[
                "Xiaomi distilled MiMo-V2.6 into a 9B Qwen model, a size that fits a single consumer or workstation card.",
                "With Q4_K_M, R9700 decodes 71.7 tok/s for one request and W7900 71.5, almost a tie; Strix Halo gives 31.8 tok/s.",
            ],
            sections=[
                ("New card and old card, a tie", [
                    "R9700 is a new RDNA 4 card; W7900 is an RDNA 3 workstation card. On this 9B model they decode 71.7 against 71.5 tok/s for one request, and W7900 is slightly ahead at 32 requests (232 against 225).",
                    "If you already own a W7900, there is no need to change cards for a model this size.",
                ]),
            ],
            tips=["On R9700, Q8_0 takes 523 ms to the first token, twice Q4_K_M's 267 ms. For chat, prefer Q4_K_M."],
        ),
    ),
    "mimo-v2.6-flash": dict(
        hero=("r9700", "llama.cpp", "IQ2_XS_M", 4),
        layout="data",
        zh=dict(
            title="把小米 MiMo-V2.6-Flash 塞进四张显卡：2 比特量化实测",
            excerpt="超大模型本地跑，只能靠极限量化。IQ2_XS_M 下四张 W7900 单请求 25.1 tok/s，四张 R9700 16.4。",
            lead=[
                "MiMo-V2.6-Flash 是小米的大模型，原版权重远超单机显存。要在本地跑，只能把它压到 2 比特。",
                "我们用 IQ2_XS_M 量化版，分别在四张 W7900 和四张 R9700 上跑通：单请求 25.1 和 16.4 tok/s。",
            ],
            sections=[
                ("能跑，但要接受代价", [
                    "2 比特量化会损失一部分质量，它的意义是“能在本地跑起来”，而不是“和原版一样好”。",
                    "首 token 时延也长：W7900 2.6 秒，R9700 5.1 秒。适合不赶时间的长文本任务，不适合实时对话。",
                    "W7900 四卡比 R9700 四卡快，原因是 4 × 48GB 的总显存更宽裕。",
                ]),
            ],
            tips=["配方用 --load-mode none 加载，照抄即可。四张卡都要对容器可见。"],
        ),
        en=dict(
            title="Squeezing Xiaomi MiMo-V2.6-Flash into four GPUs: 2-bit quantization measured",
            excerpt="Running a giant model locally takes extreme quantization. With IQ2_XS_M, four W7900 cards decode 25.1 tok/s for one request, four R9700 cards 16.4.",
            lead=[
                "MiMo-V2.6-Flash is Xiaomi's large model, and its original weights are far beyond one machine's memory. Running it locally means squeezing it to 2 bits.",
                "We ran the IQ2_XS_M build on four W7900 and four R9700 cards: 25.1 and 16.4 tok/s for one request.",
            ],
            sections=[
                ("It runs, at a price", [
                    "2-bit quantization costs some quality. The point is to run it locally at all, not to match the original.",
                    "The first token is slow too: 2.6 seconds on W7900, 5.1 seconds on R9700. Fine for unhurried long-form tasks, not for live chat.",
                    "Four W7900 cards beat four R9700 cards because 4 x 48GB leaves more headroom.",
                ]),
            ],
            tips=["The recipe loads with --load-mode none; keep it. All four cards must be visible to the container."],
        ),
    ),
    "mimo-v2.5": dict(
        hero=("strix", "llama.cpp", "UD-Q2_K_XL", 1),
        layout="tutorial",
        zh=dict(
            title="一台 Strix Halo 迷你主机跑小米 MiMo-V2.5：单请求 19.2 tok/s",
            excerpt="小米 MiMo-V2.5 大模型，UD-Q2_K_XL 量化后在一台 Strix Halo 上跑起来，单请求 19.2 tok/s。",
            lead=[
                "MiMo-V2.5 是小米的大型模型。一般这种体量要多张显卡，但 Strix Halo 的统一内存让它在一台迷你主机上就能跑。",
                "用 UD-Q2_K_XL 量化版，单请求 19.2 tok/s，32 并发 39 tok/s。",
            ],
            sections=[
                ("适合什么场景", [
                    "19.2 tok/s 用来对话已经可以接受，大概是一个人正常阅读的速度。",
                    "2 比特量化有质量损失，适合想在本地体验大模型、或者对数据隐私要求高的场景。",
                ]),
            ],
            tips=["配方加了 --no-mmap，让权重一次性读进内存，照抄即可。"],
        ),
        en=dict(
            title="Xiaomi MiMo-V2.5 on one Strix Halo mini PC: 19.2 tok/s",
            excerpt="Xiaomi's large MiMo-V2.5, quantized to UD-Q2_K_XL, runs on a single Strix Halo at 19.2 tok/s for one request.",
            lead=[
                "MiMo-V2.5 is Xiaomi's large model. A model this size usually needs several GPUs, but Strix Halo's unified memory runs it on one mini PC.",
                "With the UD-Q2_K_XL build it decodes 19.2 tok/s for one request and 39 tok/s at 32.",
            ],
            sections=[
                ("What it is good for", [
                    "19.2 tok/s is usable for chat, about the pace of normal reading.",
                    "2-bit quantization costs quality. It suits trying a large model locally, or work where data must stay on your own machine.",
                ]),
            ],
            tips=["The recipe adds --no-mmap so the weights are read into memory in one go; keep it."],
        ),
    ),
    "nemotron-3.5-bolt-e4b": dict(
        hero=("r9700", "llama.cpp", "UD-Q4_K_XL", 1),
        layout="tutorial",
        zh=dict(
            title="NVIDIA 的 Nemotron 3.5 Bolt，在 AMD Radeon 上跑多快？",
            excerpt="NVIDIA 发布的开源小模型，在 AMD 显卡上照样能跑。R9700 单请求 86.2 tok/s，W7900 84.9，三步部署。",
            lead=[
                "Nemotron 是 NVIDIA 自己的开源模型系列。开源权重不挑硬件，用 llama.cpp 在 AMD 显卡上一样能跑。",
                "Nemotron 3.5 Bolt E4B 的 UD-Q4_K_XL 版本，R9700 单请求 86.2 tok/s，W7900 84.9 tok/s，Strix Halo 46.5 tok/s。",
            ],
            sections=[
                ("BF16 并发出乎意料地好", [
                    "R9700 上 BF16 单请求 46.0 tok/s，比 4 比特慢不少；但 32 并发总吞吐 438 tok/s，和 4 比特的 433 打平，首 token 也最短（118 ms）。",
                    "要给多人用而且在意质量，这张卡上直接跑 BF16 就行。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="How fast does NVIDIA's Nemotron 3.5 Bolt run on AMD Radeon?",
            excerpt="NVIDIA's open small model runs on AMD GPUs just the same. 86.2 tok/s on R9700, 84.9 on W7900, deployed in three steps.",
            lead=[
                "Nemotron is NVIDIA's own open model family. Open weights do not care about the hardware, and llama.cpp runs them on AMD GPUs too.",
                "Nemotron 3.5 Bolt E4B in UD-Q4_K_XL decodes 86.2 tok/s for one request on R9700, 84.9 on W7900 and 46.5 on Strix Halo.",
            ],
            sections=[
                ("BF16 holds up under load", [
                    "On R9700, BF16 gives 46.0 tok/s for one request, well below 4-bit. But at 32 requests it delivers 438 tok/s, level with 4-bit's 433, and has the shortest first token (118 ms).",
                    "To serve several users and keep full quality, just run BF16 on this card.",
                ]),
            ],
            tips=[],
        ),
    ),
    "nemotron-3.5-bolt-74b-a9b": dict(
        hero=("r9700", "llama.cpp", "UD-Q4_K_XL", 2),
        layout="tutorial",
        zh=dict(
            title="Nemotron 3.5 Bolt 74B：两张 R9700 单请求 34.6 tok/s",
            excerpt="NVIDIA 的 74B MoE 模型，两张 R9700 或两张 W7900 就能跑，Strix Halo 一台也行。实测和部署命令。",
            lead=[
                "Nemotron 3.5 Bolt 74B-A9B 是 NVIDIA 的 MoE 模型，总参数 74B，每个 token 激活约 9B。",
                "4 比特下，两张 R9700 单请求 34.6 tok/s，两张 W7900 39.0 tok/s；Strix Halo 单机 18.3 tok/s。",
            ],
            sections=[
                ("两张卡就够", [
                    "UD-Q4_K_XL 在两张 R9700 上就能放下。Q8_0 要四张 R9700，单请求 29.8 tok/s，反而比 4 比特两卡慢。",
                    "W7900 两张卡就能跑 Q8_0，单请求 35.3 tok/s，32 并发 113。",
                ]),
            ],
            tips=["两卡配置要让容器看到两张卡：HIP_VISIBLE_DEVICES=0,1。"],
        ),
        en=dict(
            title="Nemotron 3.5 Bolt 74B: 34.6 tok/s on two R9700 cards",
            excerpt="NVIDIA's 74B MoE model runs on two R9700 or two W7900 cards, or on one Strix Halo. Measurements and commands.",
            lead=[
                "Nemotron 3.5 Bolt 74B-A9B is NVIDIA's MoE model with 74B parameters in total and about 9B active per token.",
                "At 4 bits, two R9700 cards decode 34.6 tok/s for one request and two W7900 cards 39.0; one Strix Halo gives 18.3 tok/s.",
            ],
            sections=[
                ("Two cards are enough", [
                    "UD-Q4_K_XL fits on two R9700 cards. Q8_0 needs four R9700 cards and gives 29.8 tok/s for one request, slower than 4-bit on two.",
                    "Two W7900 cards can run Q8_0: 35.3 tok/s for one request, 113 at 32.",
                ]),
            ],
            tips=["For the two-card setup the container must see both cards: HIP_VISIBLE_DEVICES=0,1."],
        ),
    ),
    "nemotron-3.5-lightning-30b-a3b": dict(
        hero=("r9700", "llama.cpp", "Q4_0", 1),
        layout="tutorial",
        zh=dict(
            title="Nemotron 3.5 Lightning 30B：一张 R9700 单请求 93.2 tok/s",
            excerpt="NVIDIA 的 30B MoE 模型，每个 token 激活约 3B。R9700 单卡 93.2 tok/s，W7900 90.4，Strix Halo 50.3。",
            lead=[
                "Nemotron 3.5 Lightning 30B-A3B 是 NVIDIA 的 MoE 模型，和 Qwen3-30B-A3B 同一个量级。",
                "一张 R9700 跑 Q4_0，单请求 93.2 tok/s；W7900 90.4 tok/s；Strix Halo 50.3 tok/s。",
            ],
            sections=[
                ("单人选一张卡，多人选两张", [
                    "R9700 单卡 Q4_0 的 32 并发是 186 tok/s。换成两张卡跑 Q8_0，单请求降到 81.3，但 32 并发升到 274。",
                    "一个人用，一张卡 Q4_0；要服务多人，两张卡 Q8_0，质量和并发都更好。",
                ]),
            ],
            tips=["这个模型用的是 Q4_0 格式，下载时注意文件名。"],
        ),
        en=dict(
            title="Nemotron 3.5 Lightning 30B: 93.2 tok/s on one R9700",
            excerpt="NVIDIA's 30B MoE model activates about 3B parameters per token. 93.2 tok/s on one R9700, 90.4 on W7900, 50.3 on Strix Halo.",
            lead=[
                "Nemotron 3.5 Lightning 30B-A3B is NVIDIA's MoE model, in the same class as Qwen3-30B-A3B.",
                "One R9700 with Q4_0 decodes 93.2 tok/s for one request; W7900 90.4; Strix Halo 50.3.",
            ],
            sections=[
                ("One card for one user, two for many", [
                    "One R9700 with Q4_0 gives 186 tok/s at 32 requests. Two cards with Q8_0 drop one request to 81.3 but raise 32 requests to 274.",
                    "For one user, one card with Q4_0. For many, two cards with Q8_0: better quality and more throughput.",
                ]),
            ],
            tips=["This model uses the Q4_0 format; check the file name when downloading."],
        ),
    ),
    "nemotron-3.5-super-vl-120b-a12b": dict(
        hero=("strix", "llama.cpp", "UD-Q4_K_XL", 1),
        alt=[("r9700", "llama.cpp", "UD-Q4_K_XL", 4)],
        layout="data",
        zh=dict(
            title="120B 的 Nemotron 3.5 Super VL，一台 Strix Halo 也能跑",
            excerpt="NVIDIA 的 120B 视觉语言 MoE 模型，4 比特量化后一台 Strix Halo 迷你主机单请求 14.1 tok/s，四张 W7900 32.2。",
            lead=[
                "120B 参数的模型，通常要一整台多卡服务器。Nemotron 3.5 Super VL 是 MoE，每个 token 激活约 12B，4 比特后能装进 Strix Halo 的统一内存。",
                "一台 Strix Halo 单请求 14.1 tok/s；四张 W7900 32.2 tok/s，四张 R9700 27.2 tok/s。",
            ],
            sections=[
                ("先说清楚测了什么", [
                    "这是一个视觉语言模型，但我们的测试只发了文本提示词，没有测图片输入。下面的数字只代表文本生成速度。",
                    "Strix Halo 的 14.1 tok/s 够用来对话，首 token 1.9 秒左右。四张 W7900 的 32 并发是 96 tok/s，适合给团队共用。",
                ]),
            ],
            tips=["Strix Halo 的配方用 --load-mode none 加载，照抄即可。"],
        ),
        en=dict(
            title="The 120B Nemotron 3.5 Super VL runs on a single Strix Halo",
            excerpt="NVIDIA's 120B vision-language MoE model, at 4 bits, decodes 14.1 tok/s on one Strix Halo mini PC and 32.2 on four W7900 cards.",
            lead=[
                "A 120B model usually means a multi-GPU server. Nemotron 3.5 Super VL is an MoE with about 12B active per token, and at 4 bits it fits in Strix Halo's unified memory.",
                "One Strix Halo decodes 14.1 tok/s for one request; four W7900 cards 32.2, four R9700 cards 27.2.",
            ],
            sections=[
                ("What we did and did not test", [
                    "This is a vision-language model, but our test sends text prompts only; image input was not measured. The numbers are text generation speed.",
                    "14.1 tok/s on Strix Halo is usable for chat, with a first token around 1.9 seconds. Four W7900 cards give 96 tok/s at 32, enough for a team.",
                ]),
            ],
            tips=["The Strix Halo recipe loads it with --load-mode none; keep it."],
        ),
    ),
    "minicpm-v-4.7-1b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="MiniCPM-V 4.7 1B：单请求 211.5 tok/s，32 并发 842",
            excerpt="OpenBMB 的 1B 视觉语言小模型，R9700 单请求 211.5 tok/s，W7900 32 并发 842 tok/s。三步部署。",
            lead=[
                "MiniCPM-V 4.7 1B 是 OpenBMB 的端侧视觉语言模型，只有 1B 参数。",
                "它在 AMD 显卡上非常快：R9700 跑 Q4_K_M 单请求 211.5 tok/s；W7900 32 并发总吞吐 842 tok/s，是榜单上的最高值之一。",
            ],
            sections=[
                ("先说清楚测了什么", [
                    "测试只发了文本提示词，没有测图片输入，数字代表文本生成速度。",
                    "Strix Halo 上也有 175.2 tok/s，首 token 87 ms，放在迷你主机上常驻完全没问题。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="MiniCPM-V 4.7 1B: 211.5 tok/s for one request, 842 for 32",
            excerpt="OpenBMB's 1B vision-language model decodes 211.5 tok/s on R9700 and delivers 842 tok/s at 32 requests on W7900. Three steps to deploy.",
            lead=[
                "MiniCPM-V 4.7 1B is OpenBMB's on-device vision-language model, with just 1B parameters.",
                "It is very fast on AMD GPUs: R9700 with Q4_K_M decodes 211.5 tok/s for one request, and W7900 reaches 842 tok/s in total at 32, among the highest on the board.",
            ],
            sections=[
                ("What we did and did not test", [
                    "The test sends text prompts only; image input was not measured. The numbers are text generation speed.",
                    "Strix Halo still gives 175.2 tok/s with an 87 ms first token, easily enough to keep it running on a mini PC.",
                ]),
            ],
            tips=[],
        ),
    ),
    "minicpm-v-4.7-35b-a3b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        layout="tutorial",
        zh=dict(
            title="MiniCPM-V 4.7 35B-A3B：35B 视觉 MoE，一张 R9700 单请求 82.8 tok/s",
            excerpt="OpenBMB 的 35B 视觉语言 MoE，每个 token 激活约 3B。R9700 单卡 82.8 tok/s，W7900 80.2，Strix Halo 52.4。",
            lead=[
                "MiniCPM-V 4.7 35B-A3B 是 OpenBMB 的大号视觉语言模型，MoE 结构，每个 token 激活约 3B。",
                "4 比特下一张卡就能跑：R9700 单请求 82.8 tok/s，W7900 80.2 tok/s，Strix Halo 52.4 tok/s。",
            ],
            sections=[
                ("先说清楚测了什么", [
                    "测试只发了文本提示词，没有测图片输入。",
                    "要更好的质量可以用 Q8_0：W7900 单卡就能放下，单请求 69.6 tok/s；R9700 需要两张卡，66.0 tok/s。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="MiniCPM-V 4.7 35B-A3B: a 35B vision MoE at 82.8 tok/s on one R9700",
            excerpt="OpenBMB's 35B vision-language MoE activates about 3B parameters per token. 82.8 tok/s on one R9700, 80.2 on W7900, 52.4 on Strix Halo.",
            lead=[
                "MiniCPM-V 4.7 35B-A3B is OpenBMB's larger vision-language model, an MoE with about 3B active per token.",
                "At 4 bits it runs on one card: 82.8 tok/s for one request on R9700, 80.2 on W7900, 52.4 on Strix Halo.",
            ],
            sections=[
                ("What we did and did not test", [
                    "The test sends text prompts only; image input was not measured.",
                    "For better quality use Q8_0: it fits on one W7900 at 69.6 tok/s for one request; R9700 needs two cards and gives 66.0.",
                ]),
            ],
            tips=[],
        ),
    ),
    "minicpm5-2b": dict(
        hero=("r9700", "llama.cpp", "Q4_K_M", 1),
        alt=[("r9700", "llama.cpp", "F16", 1)],
        layout="compare",
        zh=dict(
            title="MiniCPM5-2B 要不要量化？R9700 上 F16 和 Q4_K_M 的并发只差一点",
            excerpt="单请求 Q4_K_M 快很多（144.9 对 84.9 tok/s），但 32 并发时 F16 704、Q4_K_M 760，几乎一样。小模型的量化选择看用途。",
            lead=[
                "2B 的模型，原版 F16 只有几 GB，显存完全不是问题。那还要不要量化？",
                "看你怎么用。R9700 上单请求，Q4_K_M 144.9 tok/s，F16 84.9；32 并发时，Q4_K_M 760 tok/s，F16 704，几乎一样。",
            ],
            sections=[
                ("一个人用量化，一群人用原版", [
                    "单请求速度看每个 token 读多少权重，量化收益明显。",
                    "并发高时，瓶颈从读权重转到了计算和调度，量化的收益就小了。这时候用 F16 原版，质量没有损失，吞吐也只差一点。",
                    "W7900 上同样：单请求 Q4_K_M 149.9 对 F16 98.1，32 并发 713 对 576。",
                ]),
            ],
            tips=[],
        ),
        en=dict(
            title="Should you quantize MiniCPM5-2B? On R9700, F16 and Q4_K_M are close under load",
            excerpt="For one request Q4_K_M is much faster (144.9 vs 84.9 tok/s), but at 32 requests F16 gives 704 and Q4_K_M 760. For small models, choose by use.",
            lead=[
                "A 2B model in F16 is only a few GB, so memory is no issue. Do you still quantize?",
                "It depends on use. On R9700 one request runs at 144.9 tok/s with Q4_K_M and 84.9 with F16; at 32 requests, 760 against 704, nearly the same.",
            ],
            sections=[
                ("Quantize for one user, keep the original for many", [
                    "Single-request speed depends on weight bytes per token, so quantization pays off clearly.",
                    "Under heavy load the limit shifts from reading weights to compute and scheduling, and the gain shrinks. F16 then keeps full quality at nearly the same throughput.",
                    "W7900 agrees: for one request Q4_K_M 149.9 against F16 98.1; at 32, 713 against 576.",
                ]),
            ],
            tips=[],
        ),
    ),
    "step-3.5-flash": dict(
        hero=("strix", "llama.cpp", "Q4_K_S", 1),
        layout="tutorial",
        zh=dict(
            title="阶跃 Step-3.5-Flash 上 Strix Halo：一台迷你主机单请求 23.5 tok/s",
            excerpt="阶跃星辰的大模型，Q4_K_S 量化后在一台 Strix Halo 上跑起来，单请求 23.5 tok/s，32 并发 118。",
            lead=[
                "Step-3.5-Flash 是阶跃星辰的大型模型。借助 Strix Halo 的大容量统一内存，它可以在一台迷你主机上本地运行。",
                "Q4_K_S 量化版单请求 23.5 tok/s，32 并发 118 tok/s，对话和小团队共用都够。",
            ],
            sections=[
                ("一台机器装下大模型", [
                    "这类大模型放在独立显卡上一般要多卡，Strix Halo 用一块集成显卡就装下了，部署也更简单：一条 docker 命令，不用考虑多卡切分。",
                ]),
            ],
            tips=["配方加了 --no-mmap，照抄即可。"],
        ),
        en=dict(
            title="StepFun Step-3.5-Flash on Strix Halo: 23.5 tok/s on one mini PC",
            excerpt="StepFun's large model, quantized to Q4_K_S, runs on one Strix Halo at 23.5 tok/s for one request and 118 at 32.",
            lead=[
                "Step-3.5-Flash is StepFun's large model. Strix Halo's large unified memory lets it run locally on a single mini PC.",
                "The Q4_K_S build decodes 23.5 tok/s for one request and 118 tok/s at 32, enough for chat and for a small team.",
            ],
            sections=[
                ("A large model in one machine", [
                    "On discrete cards a model this size usually needs several GPUs. Strix Halo holds it on one integrated GPU, and deployment is simpler: one docker command, no multi-card split.",
                ]),
            ],
            tips=["The recipe adds --no-mmap; keep it."],
        ),
    ),
    "deepseek-v4-flash": dict(
        hero=("r9700", "llama.cpp", "UD-Q2_K_XL", 4),
        alt=[("strix", "llama.cpp", "UD-Q2_K_XL", 1)],
        layout="compare",
        zh=dict(
            title="DeepSeek-V4-Flash 本地部署：四张 R9700，还是一台 Strix Halo？",
            excerpt="2 比特量化的 DeepSeek-V4-Flash，四张 R9700 单请求 19.6 tok/s，一台 Strix Halo 11.5。两种方案的完整命令。",
            lead=[
                "DeepSeek-V4-Flash 是 DeepSeek 的大型模型。本地跑它，硬件门槛是第一个问题。",
                "我们给两套方案：四张 R9700 跑 UD-Q2_K_XL，单请求 19.6 tok/s，32 并发 76；一台 Strix Halo 跑同样的量化版，单请求 11.5 tok/s。",
            ],
            sections=[
                ("怎么选", [
                    "四张 R9700：更快，并发更高，适合团队共用。四张 W7900 和它差不多，单请求 18.9 tok/s，32 并发 54。",
                    "一台 Strix Halo：慢一些，首 token 2.5 秒左右，但只是一台迷你主机，功耗和体积小得多，适合个人体验和离线使用。",
                    "2 比特量化会损失一部分质量，这是把它放进本地硬件的代价。",
                ]),
            ],
            tips=["Strix Halo 的配方用 --load-mode none 加载，照抄即可。"],
        ),
        en=dict(
            title="DeepSeek-V4-Flash at home: four R9700 cards or one Strix Halo?",
            excerpt="DeepSeek-V4-Flash at 2 bits decodes 19.6 tok/s on four R9700 cards and 11.5 on one Strix Halo. Full commands for both.",
            lead=[
                "DeepSeek-V4-Flash is DeepSeek's large model. To run it locally, hardware is the first question.",
                "Two setups: four R9700 cards with UD-Q2_K_XL, 19.6 tok/s for one request and 76 at 32; one Strix Halo with the same build, 11.5 tok/s.",
            ],
            sections=[
                ("Which to pick", [
                    "Four R9700 cards: faster, more concurrency, good for a team. Four W7900 cards are similar, 18.9 tok/s for one request and 54 at 32.",
                    "One Strix Halo: slower, with a first token around 2.5 seconds, but it is a single mini PC with far lower power draw and size, good for personal and offline use.",
                    "2-bit quantization costs some quality; that is the price of fitting it on local hardware.",
                ]),
            ],
            tips=["The Strix Halo recipe loads it with --load-mode none; keep it."],
        ),
    ),
    "glm-5.3-flash": dict(
        hero=("r9700", "llama.cpp", "UD-IQ2_XXS", 4),
        layout="tutorial",
        zh=dict(
            title="GLM-5.3-Flash 本地跑：四张 R9700 单请求 21.9 tok/s",
            excerpt="智谱 GLM-5.3-Flash 的 2 比特量化版，四张 R9700 单请求 21.9 tok/s，四张 W7900 21.7。完整部署命令。",
            lead=[
                "GLM-5.3-Flash 是智谱 Z.ai 的大型模型。用 UD-IQ2_XXS 量化后，四张显卡就能放下。",
                "四张 R9700 单请求 21.9 tok/s，32 并发 58；四张 W7900 21.7 tok/s，32 并发 67。",
            ],
            sections=[
                ("两种四卡方案差不多", [
                    "单请求两者几乎一样，W7900 并发略高。手上有哪种卡就用哪种。",
                    "这个模型还没有在 Strix Halo 上测过。",
                ]),
            ],
            tips=["四张卡都要对容器可见：HIP_VISIBLE_DEVICES=0,1,2,3。"],
        ),
        en=dict(
            title="GLM-5.3-Flash at home: 21.9 tok/s on four R9700 cards",
            excerpt="Z.ai's GLM-5.3-Flash at 2 bits decodes 21.9 tok/s on four R9700 cards and 21.7 on four W7900 cards. Full deployment commands.",
            lead=[
                "GLM-5.3-Flash is Z.ai's large model. Quantized to UD-IQ2_XXS, it fits on four GPUs.",
                "Four R9700 cards decode 21.9 tok/s for one request and 58 at 32; four W7900 cards 21.7 tok/s and 67 at 32.",
            ],
            sections=[
                ("Two four-card setups, much the same", [
                    "One request is almost identical; W7900 is a little ahead under load. Use whichever cards you have.",
                    "This model has not been measured on Strix Halo yet.",
                ]),
            ],
            tips=["All four cards must be visible to the container: HIP_VISIBLE_DEVICES=0,1,2,3."],
        ),
    ),
}
