import { A, C, H2, Lead, P, Pre, Table, UL, type BlogPost } from "./blogUi";
import { ENGINE_POSTS, ENGINE_POSTS_ZH, MODEL_POSTS, MODEL_POSTS_ZH } from "./blogModels";
import type { Lang } from "./i18n";

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
          llama.cpp&apos;s Windows ROCm build, which found no GPU here. The agent reported the error to the service, whose
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

const AB_PROMPT_ZH = `帮我在这台电脑上把 Qwen3.8-27B 部署起来，用本机的 AMD 显卡推理。
要求：
1. 提供 OpenAI 兼容的 API，必须带 API Key 才能访问；
2. 支持工具调用（function calling）；
3. 服务在后台常驻，你退出以后也要继续运行；
4. WorkBuddy 这类客户端只要填 Base URL 和 API Key 就能直接用。
5. 按正确的方法跑起来、能正常调用就行，性能不用管：不用测速、不用跑 benchmark，
   也不要为了速度换方案或调参数。
完成后把 base_url、api_key、model 三项写进 C:\\Users\\devNN\\result.json，
并自己调用一次，确认能正常回复。
[仅 B 组] 我已经装好了 AMD GPU 支持助手的 MCP 工具（radeon），
部署前先用它查清楚怎么做，遇到问题也先问它。
说明：这个账号没有管理员权限。我不在电脑旁边，不要问我问题，自己判断，一直做到完成。`;

// Chinese version of POSTS. Same facts and numbers; keep the two in step.
const POSTS_ZH: BlogPost[] = [
  {
    slug: "support-agent-ab-test-windows-strix-halo",
    title: "A/B 测试：AMD GPU 支持助手能帮编程智能体部署本地模型吗？",
    date: "2026-11-26",
    readingMinutes: 9,
    tags: ["A2A", "智能体", "Strix Halo", "Windows", "llama.cpp"],
    excerpt:
      "同一个任务、同一个编程智能体：在中国大陆网络下的一台 Windows Strix Halo 笔记本上，接入我们的支持助手跑三次，不接入跑三次。接入后的中位数更慢、用的 token 更多，主要原因是 29 次调用我们的服务有 22 次失败。",
    content: (
      <>
        <Lead>
          我们做 AMD GPU 支持助手，是想让 AI 编程智能体更会在 AMD 硬件上搭本地推理。为了验证它到底有没有用，我们让
          Claude Code 把同一个任务做了六遍：在一台 Radeon 8060S 的 Windows 笔记本上部署 Qwen3.8-27B。三次可以用支持助手，三次不能用。在这个环境里，它没有帮上忙。B 组的中位数是
          62 分钟、250 万输入 token（A 组是 47 分钟、140 万）；此外，我们服务端的模型还读了 270 万输入 token（中位数）。主要原因是：从测试机的网络出发，调用我们服务的 29 次里有 22 次失败。
        </Lead>

        <H2>任务</H2>
        <P>
          测试机是一台 HP ZBook Ultra G1a 14 笔记本：Ryzen AI Max+ PRO 395，Radeon 8060S（Strix Halo，gfx1151），128 GB
          统一内存，Windows 11，AMD 驱动 32.0.32029.2010。它在中国大陆网络下：Hugging Face、Docker Hub 和 Google 打不开，hf-mirror
          和 ModelScope 镜像能用，GitHub release 下载很慢，有时会被重置。
        </P>
        <P>
          编程智能体是无界面模式的 Claude Code 2.1.331，主模型 Claude Opus 5.5，小任务用 Claude Haiku 5.5。每次运行都用同一段中文提示词，原文如下：
        </P>
        <Pre>{AB_PROMPT_ZH}</Pre>
        <P>
          第 5 条是上一轮测试之后加上的。上一轮没有这条要求，两组智能体在服务早已跑通之后还在反复测速、调参，运行时间反映的是调优花了多少力气，而不是部署本身。模型跑多快是推理引擎的事，这个任务要的是把它正确地跑起来。我们丢掉了那几次结果，加上第
          5 条，并修改了支持助手，让它给出的方案不再引用速度数字、也不再加调优步骤（0.2.2 版）。
        </P>

        <H2>两组</H2>
        <UL>
          <li>
            <strong>A</strong>：只用 Claude Code。
          </li>
          <li>
            <strong>B</strong>：Claude Code 加上以 MCP 工具形式接入的支持助手。一个小连接器把问题转发到 <A href="/zh/docs">API 文档</A>
            里介绍的 A2A 接口，也会读取本站发布的测试结果和配方。连接器还没有公开发布，它调用的接口已经公开。
          </li>
        </UL>

        <H2>如何保证公平</H2>
        <UL>
          <li>
            每次运行都用一个新建的、没有管理员权限的普通 Windows 账号，跑完就删。每次运行在个人目录之外留下的文件（比如{" "}
            <C>C:\llm</C>）会在下一次运行前清掉。
          </li>
          <li>提示词里从没提到 Radeon Arena。智能体只看到一个本地 API 地址，用来访问它自己的模型；我们在这里统计每一个请求。</li>
          <li>两组交替运行：A5、B5、A6、B6、A7、B7。编号接着上一轮往下排。</li>
          <li>每份运行记录我们都读过。A 组没有一次访问过 radeon-arena.com。</li>
        </UL>

        <H2>怎么检查结果</H2>
        <P>
          每次运行结束后，由一个独立脚本拿智能体报告的 base URL、key 和模型名做检查：带 key 能列出模型，不带 key 返回
          401；对话请求能得到回答；带 <C>get_weather</C> 工具的请求能返回工具调用；服务进程占用了 GPU 显存。六次全部通过。我们没有测速度。
        </P>

        <H2>结果</H2>
        <P>
          六次部署最后都用了 llama.cpp 的 Vulkan 版本。分钟数是智能体从第一个动作到最后一个动作的实际耗时；请求、输入、输出是编程智能体的模型请求数和
          token 数；工具是它调用工具的次数。输入包含命中缓存的提示 token，每次运行里都占输入的 90–96%。
        </P>
        <Table
          head={["运行", "权重", "分钟", "请求", "输入", "输出", "工具"]}
          numericFrom={2}
          emphasis={[6, 7]}
          rows={[
            ["A5", "BF16（自行转换）", "95.3", "63", "3,712,704", "31,466", "62"],
            ["A6", "Q8_0", "47.0", "34", "1,137,795", "15,773", "30"],
            ["A7", "Q8_0", "46.3", "37", "1,406,591", "14,209", "34"],
            ["B5", "UD-Q4_K_M", "39.2", "42", "2,212,448", "17,563", "47"],
            ["B6", "Q8_0", "62.3", "54", "2,546,832", "16,134", "54"],
            ["B7", "Q8_0", "79.8", "60", "2,673,637", "21,252", "64"],
            ["A 中位数", "", "47.0", "37", "1,406,591", "15,773", "34"],
            ["B 中位数", "", "62.3", "54", "2,546,832", "17,563", "54"],
          ]}
        />
        <P>
          支持助手用的是它自己的模型（Claude Haiku 5.5）。下表是 B 组在服务这一侧的情况：编程智能体调用服务的次数和其中失败的次数，以及服务端统计的会话数、模型调用次数和
          token 数。
        </P>
        <Table
          head={["运行", "调用", "失败", "会话", "模型调用", "输入", "输出"]}
          rows={[
            ["B5", "5", "3", "4", "18", "2,731,775", "65,963"],
            ["B6", "8", "3", "1", "11", "1,430,107", "35,219"],
            ["B7", "16", "16", "12", "49", "6,466,643", "218,561"],
          ]}
        />
        <P>两边相加，B 组三次的中位数约为 490 万输入 token，A 组是 140 万。</P>

        <H2>B 组发生了什么</H2>
        <P>
          <strong>调用我们服务的请求大多失败了。</strong>29 次调用里失败 22 次：15 次连接超时，5 次读取超时，1
          次协议错误，1 次会话丢失。智能体等待、重试，很多时候最后没拿到回答就继续往下做。
        </P>
        <P>
          <strong>失败的调用照样消耗 token。</strong>客户端超时并不会让服务端停下手里的活。B7 里智能体调用了 12 次 start，服务开了 12
          个会话、写了 10 份方案，没有一份送到智能体手里。光这一次运行，服务端就花了 650 万输入 token。
        </P>
        <P>
          <strong>B6 收到的方案对这台机器是错的。</strong>方案在运行第 18 分钟送到，选的是 llama.cpp 的 Windows ROCm
          版本，在这台机器上找不到 GPU。智能体把这个错误报给了支持助手；支持助手的排障功能判断是那个安装包里缺少 hipBLAS 和 rocBLAS 库，建议改用同一版本的 Vulkan
          版本，换过去之后跑通了。从收到方案到切换过去用了 30 分钟，不过其中一部分时间和模型下载是重叠的。
        </P>
        <P>
          <strong>真正起作用的帮助来自已发布的数据。</strong>B5 是所有运行里最快的一次，39 分钟，而它的每一次方案调用都失败了。智能体转而通过连接器查到本站自己的{" "}
          <A href="/zh/strix/recipes">配方</A>：Strix Halo 上的 Qwen3.8-27B UD-Q4_K_M（在 Linux 上实测）。另外，有一次提问成功拿到了回答：在
          Windows 上用 Vulkan 版本，既不需要 ROCm/HIP SDK，也不需要管理员权限。
        </P>
        <P>
          <strong>连接器在 Windows 上看不到 GPU。</strong>它的硬件检测读的是 Linux 接口，所以在 Windows 上，智能体只能自己向服务描述 GPU。
        </P>

        <H2>A 组发生了什么</H2>
        <P>
          没有外部帮助时，Opus 5.5 本来就知道这台机器上的常规做法：llama.cpp 的 Vulkan 版本，加上从镜像站下载的 GGUF。两次用了
          Q8_0，分别用 47 和 46 分钟完成。第三次把“正确的方式”理解成“尽量接近原版”：下载原始权重，装上转换工具，自己做了一份
          BF16 GGUF，用了 95 分钟。
        </P>

        <H2>我们的结论</H2>
        <UL>
          <li>服务必须在用户所在的网络里能连上。从这个网络出发，四次调用有三次失败；调用失败的帮手，比没有帮手代价更大。</li>
          <li>重试 start 时应该接上已经在跑的会话，而不是重新规划；客户端放弃之后，服务端也应停止处理它的请求。</li>
          <li>服务端每次模型调用平均读 13 万到 15.2 万输入 token，部分原因是规划器每次调用都把所有已发布的配方带上。</li>
          <li>给 Windows 的方案必须符合 Windows 上实际能跑的情况；B6 方案里的 ROCm 版本就不符合。</li>
          <li>连接器需要能在 Windows 上识别 GPU。</li>
          <li>常见模型配常见硬件，强的编程智能体不太需要帮助。我们提供的东西里最有用的，是这个模型在这块 GPU 上的一份实测配方。</li>
        </UL>

        <H2>局限</H2>
        <UL>
          <li>每组三次，一台机器，一种网络。中位数只能看出方向，不能当作精确的效果大小。</li>
          <li>三次 B 组运行用的是同一台服务器，但在 B5 和 B6 之间，服务新增了一个把 AMD 官方文档同步进知识库的任务。</li>
          <li>智能体一侧的请求数和 token 数来自本地计量代理；服务一侧的数字来自服务自己的会话记录。</li>
        </UL>
      </>
    ),
  },
];

const ALL_POSTS: Record<Lang, BlogPost[]> = {
  en: [...POSTS, ...ENGINE_POSTS, ...MODEL_POSTS],
  zh: [...POSTS_ZH, ...ENGINE_POSTS_ZH, ...MODEL_POSTS_ZH],
};

// Every post exists in both languages under the same slug; fail the build otherwise.
if (ALL_POSTS.en.map((p) => p.slug).join(",") !== ALL_POSTS.zh.map((p) => p.slug).join(",")) {
  throw new Error("English and Chinese blog posts are out of sync");
}

// Newest first; posts with the same date keep the order above.
export function allPosts(lang: Lang = "en"): BlogPost[] {
  return [...ALL_POSTS[lang]].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string, lang: Lang = "en"): BlogPost | undefined {
  return ALL_POSTS[lang].find((p) => p.slug === slug);
}
