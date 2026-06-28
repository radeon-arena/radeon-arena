import type { ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Lightweight typography primitives so posts are written as JSX with
 * no markdown dependency. Tuned for the site's light theme.
 * ------------------------------------------------------------------ */

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-lg leading-8 text-zinc-300">{children}</p>;
}
function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 border-t border-ink-800 pt-6 text-xl font-semibold tracking-tight text-zinc-100">
      {children}
    </h2>
  );
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-7 text-zinc-300">{children}</p>;
}
function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-zinc-300 marker:text-zinc-500">
      {children}
    </ul>
  );
}
function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">{children}</code>
  );
}
function Pre({ children }: { children: string }) {
  return (
    <pre className="thin-scroll mt-4 overflow-x-auto rounded-lg border border-ink-700 bg-ink-850 p-4 font-mono text-[13px] leading-6 text-zinc-200">
      <code>{children}</code>
    </pre>
  );
}
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="thin-scroll mt-5 overflow-x-auto rounded-xl border border-ink-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-850 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={`whitespace-nowrap px-4 py-2.5 font-medium ${i === head.length - 1 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {rows.map((r, ri) => (
            <tr key={ri} className="hover:bg-ink-850/60">
              {r.map((c, ci) => (
                <td key={ci} className={`px-4 py-2.5 ${ci === r.length - 1 ? "text-right font-semibold text-zinc-100" : "text-zinc-300"}`}>
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

/* ------------------------------------------------------------------ *
 * Posts
 * ------------------------------------------------------------------ */

export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  content: ReactNode;
};

const POSTS: BlogPost[] = [
  {
    slug: "dual-strix-halo-rdma",
    title: "Running large MoE on two Strix Halo boxes over RDMA",
    date: "2026-06-24",
    readingMinutes: 7,
    tags: ["RDMA", "Multi-node", "MoE", "Strix Halo"],
    excerpt:
      "128 GB of unified memory makes a single Halo genuinely useful, but the largest MoE models push you to two boxes — and that only pays off once the link between them is RDMA, not plain Ethernet.",
    content: (
      <>
        <Lead>
          Strix Halo&apos;s 128 GB of unified memory makes single-box inference genuinely useful. The
          largest MoE models push you to two boxes — and that only pays off once the link between them
          is RDMA, not plain Ethernet.
        </Lead>

        <H2>The 128 GB wall</H2>
        <P>
          A 128 GB unified-memory box runs mid-size quantized models (the 30B–70B class) comfortably:
          local inference, agents, coding assistants, small-team serving. But serving a model is not
          just holding weights. You also need KV cache, runtime buffers, concurrency headroom, and slack
          for long contexts.
        </P>
        <P>
          Large MoE models — DeepSeek, MiniMax, MiMo, Step — routinely carry 100 GB-class weights. A
          single Halo can <em>load</em> them, but the headroom for real multi-request serving evaporates.
          That is what pushes you to multiple nodes.
        </P>

        <H2>Why plain Ethernet isn&apos;t enough</H2>
        <P>
          Over ordinary networking you can bring a model up across two machines: confirm it loads, the
          distributed execution path works, outputs are correct, capacity is sufficient. That is
          bring-up, not serving.
        </P>
        <P>
          TP (tensor parallel) and EP (expert parallel) synchronize across nodes on every layer. On a
          plain network that synchronization latency lands directly in the decode path: each GPU finishes
          its slice and then waits for the other side. Amplify that wait and the two machines&apos; FLOPs
          and memory bandwidth never actually stack.
        </P>

        <H2>What TP/EP actually buys you</H2>
        <P>
          TP doesn&apos;t split the model into a front half and a back half. It splits the matrix math
          inside each layer so both GPUs work the same layer and then synchronize. For MoE you add EP,
          distributing experts across devices.
        </P>
        <UL>
          <li>Both machines compute the same layer simultaneously</li>
          <li>Both contribute FLOPs</li>
          <li>Both contribute memory bandwidth</li>
          <li>MoE adds expert parallelism on top</li>
        </UL>
        <P>
          This matters most for decode, which is memory- and small-batch-kernel bound. The whole scheme
          is only worth it if cross-node sync is cheap — which is exactly what RDMA delivers.
        </P>

        <H2>Bringing RDMA to Strix Halo</H2>
        <P>
          Two Strix Halo nodes, each an AMD Ryzen AI Max+ 395 / Radeon 8060S (<C>gfx1151</C>, 128 GB
          UMA). The RDMA device is an AMD/Xilinx <C>xib_0</C> running RoCE v2. Halo has no PCIe expansion
          slot, so the link is pulled out over OCuLink through an M.2/NVMe PCIe lane.
        </P>
        <P>The container has to pass through both the GPU and the RDMA device:</P>
        <Pre>{`--network host --ipc host \\
--device /dev/kfd --device /dev/dri --device /dev/infiniband \\
--cap-add IPC_LOCK --cap-add SYS_PTRACE \\
-v /home/amd/min_rdma:/home/amd/min_rdma:ro`}</Pre>
        <P>
          <C>xib_0</C> uses a host-built rdma-core provider, so the provider path is mounted in and the
          libibverbs / NCCL environment is set before vLLM starts:
        </P>
        <Pre>{`export NCCL_IB_HCA=xib_0
export NCCL_IB_GID_INDEX=1
export NCCL_NET=IB
export NCCL_IB_DISABLE=0
export NCCL_PROTO=LL`}</Pre>
        <P>
          <C>gfx1151</C> has no GPUDirect RDMA, so traffic takes a host bounce — not the ideal RDMA
          shape, but the NCCL/RCCL logs confirm it rides verbs <C>NET/IB</C> rather than falling back to
          TCP:
        </P>
        <Pre>{`NCCL INFO NET/IB : Using [xib_0] ... RoCE v2
Channel ... via NET/IB/0`}</Pre>

        <H2>Results</H2>
        <P>
          With RDMA in place, dual Strix Halo stops being &quot;two boxes that can hold the model&quot;
          and becomes a real serving path. Best decode throughput on dual-node TP serving:
        </P>
        <Table
          head={["Model", "Quantization", "Decode tok/s"]}
          rows={[
            ["Step-3.5", "MoE AWQ-CT", "46.90"],
            ["MiniMax-M2.7", "MoE AWQ-CT", "77.94"],
            ["MiMo-V2.5", "MoE AWQ-int4", "50.43"],
            ["Step-3.7-Flash (sym, tuned)", "MoE W4A16-sym", "138"],
            ["DeepSeek-V4-Flash", "MoE W4A16 AutoRound", "115.85"],
          ]}
        />
        <P>
          For large MoE that genuinely needs multiple nodes, this moves dual Strix Halo from a
          capacity-validation rig into a TP/EP serving-and-tuning platform.
        </P>
      </>
    ),
  },
  {
    slug: "reproducible-benchmarks-pinning",
    title: "Reproducible benchmarks start with pinned images",
    date: "2026-06-19",
    readingMinutes: 5,
    tags: ["Reproducibility", "Containers", "radeonrun"],
    excerpt:
      "Every number on this board is pinned to the exact container build that produced it. Here is why :latest is a trap and how radeonrun ties each result to a commit.",
    content: (
      <>
        <Lead>
          Every number on this leaderboard is pinned to the exact container build that produced it. Here
          is why that matters, and how radeonrun does it.
        </Lead>

        <H2><C>:latest</C> is a reproducibility trap</H2>
        <P>
          A tag like <C>rocm/vllm:latest</C> names different bits on different days. Re-pull a week later
          and you may get a newer engine, a different attention kernel, a changed default — and a
          benchmark you can no longer reproduce. For a leaderboard whose entire value is trust, that is
          disqualifying.
        </P>

        <H2>Pin to the commit, not the tag</H2>
        <P>
          radeonrun builds each engine image and tags it with the upstream commit it was built from — the
          first ten characters of the source SHA:
        </P>
        <Table
          head={["Engine", "Image tag"]}
          rows={[
            ["llama.cpp", <C key="llamacpp">fe7c8b2414</C>],
            ["vLLM (ROCm)", <C key="vllm">f5fa386fe</C>],
            ["vLLM (main)", <C key="vllm-main">92221485a</C>],
          ]}
        />
        <P>
          Recipes reference that exact tag, so a recipe says &quot;run this model with this engine at this
          commit,&quot; not &quot;whatever <C>latest</C> happens to be today.&quot;
        </P>

        <H2>Pinned tags are pull-only</H2>
        <P>
          When a recipe names a pinned tag, the runner only <em>pulls</em> it — it never silently rebuilds
          something else under the same name. A build is an explicit, separate action that produces a new
          commit tag; benchmarking never mutates the image it measures.
        </P>

        <H2>Provenance travels with the number</H2>
        <P>
          Before benchmarking, the runner reads the image&apos;s commit file and records both the
          <C>image_commit</C> and the <C>image_id</C> (digest) next to the result. The board surfaces it,
          so every row is traceable to a specific build — not just a model name and a throughput figure.
        </P>

        <H2>Even the fallbacks stay honest</H2>
        <P>
          If a build can&apos;t reach the upstream remote, its fallback tag is truncated to the same
          ten-character shape, so a degraded build is still labelled consistently. Reproducibility is not
          a feature you bolt on at the end — it is the tag discipline you keep on every run.
        </P>
      </>
    ),
  },
  {
    slug: "reading-the-leaderboard",
    title: "Reading the leaderboard: prefill, decode, and concurrency",
    date: "2026-06-15",
    readingMinutes: 6,
    tags: ["Benchmarking", "Guide"],
    excerpt:
      "The board has two test families and a concurrency suffix. Once you know what pp512, tg128 and (cN) mean, the numbers tell a clear story about your workload.",
    content: (
      <>
        <Lead>
          The board has two test families and a concurrency suffix. Once you know what <C>pp512</C>,
          <C>tg128</C> and <C>(cN)</C> mean, the numbers tell a clear story.
        </Lead>

        <H2>Prefill vs decode</H2>
        <P>
          <C>pp512</C> measures <strong>prefill</strong>: pushing a 512-token prompt through the model in
          one shot. It is compute-bound — large matmuls that keep the GPU busy — and it maps to how
          quickly a long prompt is ingested.
        </P>
        <P>
          <C>tg128</C> measures <strong>decode</strong> (token generation): emitting 128 tokens one at a
          time. It is memory-bandwidth-bound — every token streams the active weights again, so on Strix
          Halo&apos;s LPDDR5X it is the bandwidth, not the FLOPs, that caps you.
        </P>

        <H2>The <C>(cN)</C> suffix is concurrency</H2>
        <P>
          <C>(c1)</C> is a single stream; <C>(c32)</C> is 32 concurrent requests. Decode throughput
          generally climbs with concurrency as the scheduler fills otherwise-idle cycles — up to the
          point where memory bandwidth or KV-cache pressure saturates. Prefill benefits far less, because
          it already keeps the matrix units busy.
        </P>

        <H2><C>tok/s</C>, TTFT, and TPOT</H2>
        <P>
          The <C>tok/s</C> on the board is aggregate throughput. Two latency views matter for user
          experience: <strong>TTFT</strong> (time to first token, essentially prefill latency) and
          <strong> TPOT</strong> (time per output token, the decode interval a user feels while text
          streams).
        </P>

        <H2>Reading it for your workload</H2>
        <UL>
          <li>
            Single-user coding assistant? Look at <C>tg128 (c1)</C> and TTFT — latency dominates the felt
            experience.
          </li>
          <li>
            Serving many users? Look at the higher <C>(cN)</C> decode columns, where aggregate throughput
            is what you are paying for.
          </li>
        </UL>
        <P>
          Quantization shows up here too: a W4A16 model reads roughly a quarter of the bytes per token
          versus FP16, which is why low-bit MoE can decode surprisingly fast on bandwidth-limited
          hardware. That is also why the board lists quantization next to every result — it is half the
          story behind a decode number.
        </P>
      </>
    ),
  },
];

export function allPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
