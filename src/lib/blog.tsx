import { A, C, H2, Lead, P, Pre, Table, UL, type BlogPost } from "./blogUi";
import { ENGINE_POSTS, MODEL_POSTS } from "./blogModels";

export type { BlogPost } from "./blogUi";

const AB_PROMPT = `Deploy Qwen3.8-27B on this computer, running inference on its AMD GPU.
Requirements:
1. Provide an OpenAI-compatible API that only works with an API key.
2. Support tool calling (function calling).
3. Keep the service running in the background, also after you exit.
4. Clients like WorkBuddy must work by filling in just the base URL and API key.
5. Running it the correct way and answering calls is enough; ignore performance:
   no speed tests, no benchmarks, and do not switch approaches or tune
   parameters for speed.
When you are done, write base_url, api_key and model to C:\\Users\\devNN\\result.json
and call it once yourself to confirm it replies.
[B only] I have installed the MCP tools (radeon) for the AMD GPU support
assistant. Before deploying, use them to find out how to do it, and ask them
first when you run into problems.
Note: this account has no administrator rights. I am away from the computer, so
do not ask me questions; decide for yourself and keep going until it is done.`;

// A post belongs here only when every number in it comes from our own
// measurements: this board's leaderboard data or our own tests of this site's
// services. Never borrow numbers from an external write-up.
const POSTS: BlogPost[] = [
  {
    slug: "support-agent-ab-test-windows-strix-halo",
    title: "A/B test: does the AMD GPU Support Agent help a coding agent deploy a local model?",
    date: "2026-11-26",
    readingMinutes: 7,
    tags: ["A2A", "Agents", "Strix Halo", "Windows", "llama.cpp"],
    excerpt:
      "Same task, same coding agent: three runs with our support agent and three without, on a Windows Strix Halo laptop on a mainland-China network. With the support agent the median run was slower and used more tokens, mostly because 22 of 29 calls to our service failed.",
    content: (
      <>
        <Lead>
          We built the AMD GPU Support Agent to make AI coding agents better at setting up local inference on AMD
          hardware. To check whether it does, we gave Claude Code the same task six times: deploy Qwen3.8-27B on a
          Windows laptop with a Radeon 8060S. Three runs had the support agent available and three did not. In this
          setup it did not help. The median run with it took 62 minutes instead of 47 and read 2.5 million input
          tokens instead of 1.4 million, and our service&apos;s own model read a median of 2.7 million more. The main
          reason: 22 of the 29 calls to our service failed from the test machine&apos;s network.
        </Lead>

        <H2>The task</H2>
        <P>
          The machine is an HP ZBook Ultra G1a 14 laptop: Ryzen AI Max+ PRO 395, Radeon 8060S (Strix Halo, gfx1151),
          128 GB of unified memory, Windows 11 and AMD driver 32.0.32029.2010. It sits on a mainland-China network:
          Hugging Face, Docker Hub and Google do not load, the hf-mirror and ModelScope mirrors do, and GitHub release
          downloads are slow and sometimes reset.
        </P>
        <P>
          The coding agent is Claude Code 2.1.331 in headless mode, with Claude Opus 5.5 as its main model and Claude
          Haiku 5.5 for small tasks. Every run got the same prompt, written in Chinese. A translation:
        </P>
        <Pre>{AB_PROMPT}</Pre>
        <P>
          Rule 5 came from an earlier round without it. There, agents in both arms kept testing speed and tuning long
          after the server worked, so run time measured tuning effort rather than deployment. How fast a model runs is
          the inference engine&apos;s job; the task is to run it correctly. We dropped those runs, added rule 5, and
          changed the support agent so its plans no longer quote speeds or add tuning steps (version 0.2.2).
        </P>

        <H2>Two arms</H2>
        <UL>
          <li>
            <strong>A</strong>: Claude Code alone.
          </li>
          <li>
            <strong>B</strong>: Claude Code with the support agent as MCP tools. A small connector forwards questions
            to the A2A endpoint described in the <A href="/docs">API docs</A> and also reads this site&apos;s published
            results and recipes. The connector is not published yet; the endpoint it calls is.
          </li>
        </UL>

        <H2>Keeping it fair</H2>
        <UL>
          <li>
            Each run used a fresh standard Windows account without admin rights, deleted after the run. Anything a run
            left outside its profile, such as <C>C:\llm</C>, was removed before the next run.
          </li>
          <li>
            The prompt never names Radeon Arena. The agent saw only a local API endpoint for its own model, where we
            counted every request.
          </li>
          <li>Runs alternated: A5, B5, A6, B6, A7, B7. The numbering continues from the earlier round.</li>
          <li>We read every transcript. No A run contacted radeon-arena.com.</li>
        </UL>

        <H2>How we checked the result</H2>
        <P>
          After each run, a separate script took the base URL, key and model name the agent reported and checked that
          listing models works with the key and returns 401 without it, a chat request gets an answer, a request with a{" "}
          <C>get_weather</C> tool gets a tool call back, and the server process holds GPU memory. All six runs passed.
          We did not measure speed.
        </P>

        <H2>Results</H2>
        <P>
          All six deployments ended up on llama.cpp&apos;s Vulkan build. Minutes are wall time from the agent&apos;s
          first to its last action; requests, input and output are the coding agent&apos;s model requests and tokens;
          tools counts its tool calls. Input includes cached prompt tokens, which were 90–96% of the input in every
          run.
        </P>
        <Table
          head={["Run", "Weights", "Minutes", "Requests", "Input", "Output", "Tools"]}
          numericFrom={2}
          emphasis={[6, 7]}
          rows={[
            ["A5", "BF16 (converted)", "95.3", "63", "3,712,704", "31,466", "62"],
            ["A6", "Q8_0", "47.0", "34", "1,137,795", "15,773", "30"],
            ["A7", "Q8_0", "46.3", "37", "1,406,591", "14,209", "34"],
            ["B5", "UD-Q4_K_M", "39.2", "42", "2,212,448", "17,563", "47"],
            ["B6", "Q8_0", "62.3", "54", "2,546,832", "16,134", "54"],
            ["B7", "Q8_0", "79.8", "60", "2,673,637", "21,252", "64"],
            ["A median", "", "47.0", "37", "1,406,591", "15,773", "34"],
            ["B median", "", "62.3", "54", "2,546,832", "17,563", "54"],
          ]}
        />
        <P>
          The support agent runs its own model (Claude Haiku 5.5). Its side of the B runs: calls the coding agent made
          to the service and how many failed, then the sessions, model calls and tokens counted on the service.
        </P>
        <Table
          head={["Run", "Calls", "Failed", "Sessions", "Model calls", "Input", "Output"]}
          rows={[
            ["B5", "5", "3", "4", "18", "2,731,775", "65,963"],
            ["B6", "8", "3", "1", "11", "1,430,107", "35,219"],
            ["B7", "16", "16", "12", "49", "6,466,643", "218,561"],
          ]}
        />
        <P>
          Counting both sides, the median B run read about 4.9 million input tokens, against 1.4 million for the median
          A run.
        </P>

        <H2>What happened in the B runs</H2>
        <P>
          <strong>Most calls to our service failed.</strong> Of 29 calls, 22 failed: 15 connect timeouts, 5 read
          timeouts, one protocol error and one lost session. The agent waited, retried, and often went on without an
          answer.
        </P>
        <P>
          <strong>Failed calls still cost tokens.</strong> A call that times out on the client does not stop the work
          on the service. In B7 the agent called start 12 times; the service opened 12 sessions and wrote 10 plans,
          and none of them reached the agent. That run alone cost the service 6.5 million input tokens.
        </P>
        <P>
          <strong>The plan B6 received was wrong for this machine.</strong> It arrived 18 minutes into the run and chose
          llama.cpp&apos;s Windows ROCm build, which found no GPU here. The agent reported the error; our
          troubleshooting traced it to hipBLAS and rocBLAS libraries missing from that package and suggested the Vulkan
          build of the same release, which worked. The switch came 30 minutes after the plan arrived, though the model
          download overlapped part of that time.
        </P>
        <P>
          <strong>The help that worked came from published data.</strong> In B5, the fastest run of all at 39
          minutes, every planning call failed. The agent instead looked up this site&apos;s own{" "}
          <A href="/strix/recipes">recipe</A> for Qwen3.8-27B UD-Q4_K_M on Strix Halo (measured on Linux) through the
          connector, and one question got through: on Windows, use the Vulkan build, which needs neither the ROCm/HIP
          SDK nor admin rights.
        </P>
        <P>
          <strong>The connector could not see the GPU on Windows.</strong> Its hardware detection reads Linux
          interfaces, so on Windows the agent had to describe the GPU to the service itself.
        </P>

        <H2>What happened in the A runs</H2>
        <P>
          Without help, Opus 5.5 already knew the usual path on this machine: llama.cpp&apos;s Vulkan build and a GGUF
          from a mirror. Two runs used Q8_0 and finished in 47 and 46 minutes. The third read &quot;the correct
          way&quot; as &quot;as close to the original as possible&quot;: it downloaded the original weights, installed
          the conversion tools and built its own BF16 GGUF, which took 95 minutes.
        </P>

        <H2>What we take from this</H2>
        <UL>
          <li>
            The service has to be reachable where its users are. From this network three in four calls failed, and a
            helper that fails costs more than no helper.
          </li>
          <li>
            A retried start should resume the session that is already running instead of planning again, and the
            service should stop working for a client that has given up.
          </li>
          <li>
            Each model call on the service read 130,000–152,000 input tokens on average, partly because the planner
            includes every published recipe in each call.
          </li>
          <li>Plans for Windows have to match what actually runs there; the ROCm build in B6&apos;s plan did not.</li>
          <li>The connector needs to detect GPUs on Windows.</li>
          <li>
            For a common model on common hardware, a strong coding agent does not need much help. The most useful
            thing we gave it was a measured recipe for this model on this GPU.
          </li>
        </UL>

        <H2>Limits</H2>
        <UL>
          <li>
            Three runs per arm, on one machine and one network. Read the medians as a direction, not a precise effect
            size.
          </li>
          <li>
            All three B runs used the same host, but between B5 and B6 the service was updated with a job that
            syncs official AMD documentation into its knowledge base.
          </li>
          <li>
            Agent-side requests and tokens come from a local metering proxy; service-side numbers come from the
            service&apos;s own session records.
          </li>
        </UL>
      </>
    ),
  },
];

const ALL_POSTS: BlogPost[] = [...POSTS, ...ENGINE_POSTS, ...MODEL_POSTS];

// Newest first; posts with the same date keep the order above.
export function allPosts(): BlogPost[] {
  return [...ALL_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}
