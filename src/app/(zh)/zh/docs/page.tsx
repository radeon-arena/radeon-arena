import type { Metadata } from "next";
import Link from "next/link";
import { API } from "@/lib/site";
import { alternates } from "@/lib/i18n";
import { C, Code, CodeLink, DEVICE, Endpoint, ERROR, FOLLOW_UP, H3, POLL, PROFILE, REGISTER, Section, Table, TASK, VALIDATE } from "@/views/docsParts";

export const metadata: Metadata = {
  title: "API 文档 - Radeon Arena",
  description: "通过 A2A JSON-RPC 调用 AMD GPU 支持助手：鉴权、动作、JSON Schema、回复类型、错误码和限额。",
  alternates: alternates("zh", "/docs"),
};

const TOC = [
  ["overview", "概览"],
  ["quickstart", "快速上手"],
  ["authentication", "鉴权"],
  ["requests", "请求"],
  ["actions", "动作"],
  ["responses", "回复"],
  ["data-types", "数据类型"],
  ["schemas", "JSON Schema"],
  ["errors", "错误"],
  ["limits", "限额"],
  ["data-handling", "数据处理"],
  ["agent-card", "Agent Card"],
  ["versioning", "版本"],
] as const;

const ASK_ZH = `# TOKEN 是第 1 步拿到的令牌
MSG_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
curl -s https://radeon-arena.com/a2a \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'A2A-Version: 1.0' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc": "2.0", "id": 1, "method": "SendMessage", "params": {
        "message": {"messageId": "'"$MSG_ID"'", "role": "ROLE_USER",
          "parts": [{"data": {"action": "ask", "language": "zh",
            "question": "在 Ubuntu 上怎么确认 PyTorch 能识别我的 Radeon 显卡？"}}]},
        "configuration": {"returnImmediately": true}}}'
# => result.task，含任务 id、contextId 和状态`;

const EXAMPLES_ZH = `{"action": "ask", "question": "哪个 ROCm 版本支持 gfx1151？", "language": "zh"}

{"action": "troubleshoot", "error_text": "RuntimeError: No HIP GPUs are available",
 "context": "WSL2，PyTorch 用的是 ROCm 版", "language": "zh"}

{"action": "start", "need": "用 llama.cpp 跑 Qwen3-8B，提供 OpenAI 兼容接口",
 "profile": {"hardware": {"gpus": [{"gfx": "gfx1151"}]}, "software": {"os": "ubuntu 24.04"}},
 "language": "zh"}

{"action": "search_knowledge", "query": "gfx1151 GTT 内存", "language": "zh"}

{"action": "report_issue", "step_id": "s2",
 "error_text": "docker: permission denied while trying to connect to the docker daemon socket"}

{"action": "report_result", "success": true, "note": "接口已能正常回复"}`;

const EP_LABELS: [string, string, string] = ["请求体", "返回", "错误"];

export default function ApiDocsPageZh() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav aria-label="本页目录" className="sticky top-20 text-sm">
            <p className="mb-2 font-semibold text-zinc-100">本页目录</p>
            <ul className="space-y-1.5">
              {TOC.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-zinc-400 hover:text-radeon-400">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl space-y-10">
          <header id="overview" className="scroll-mt-20">
            <p className="text-sm font-medium text-radeon-500">Radeon Arena API</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">API 文档</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-400">
              通过 Radeon Arena API，你的应用或 AI Agent 可以调用 AMD GPU 支持助手。它回答在 AMD 显卡、Ryzen AI 和
              ROCm 上做 AI 的问题，诊断报错，编写本地大模型部署方案，也可以直接检索支持知识库。回答引用 AMD 官方 ROCm
              社区支持 FAQ 和 AMD 公开文档，知识库每天收录新的官方资料。
            </p>
            <nav aria-label="本页目录" className="mt-6 lg:hidden">
              <p className="text-sm font-semibold text-zinc-100">本页目录</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {TOC.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-zinc-400 hover:text-radeon-400">{label}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <Table
              rows={[
                ["协议", "A2A 1.0，基于 HTTPS 的 JSON-RPC 2.0"],
                ["接口地址", <C key="e">POST {API.endpoint}</C>],
                ["Agent Card", <CodeLink key="a" href={API.agentCard}>GET /.well-known/agent-card.json</CodeLink>],
                ["输入输出", "结构化 JSON：发送一个带 action 的 data 部件，收到一个带 schema 的 data 部件"],
                ["JSON Schema", <span key="s"><CodeLink href={API.requestSchema}>request.v1.json</CodeLink>{" "}<CodeLink href={API.replySchema}>reply.v1.json</CodeLink></span>],
                ["鉴权", "免费账户的 Bearer 令牌"],
                ["限频", "每个账户每分钟 30 条消息"],
                ["回复语言", <span key="l">任意请求里设 <C>language</C>：<C>en</C> 或 <C>zh</C></span>],
                ["流式输出、推送通知", <span key="p">不支持，用 <C>GetTask</C> 轮询。</span>],
              ]}
            />
          </header>

          <Section id="quickstart" title="快速上手">
            <p><strong className="text-zinc-100">1. 拿到令牌。</strong>生成一个 UUID 作为 <C>install_id</C>，再验证邮箱。</p>
            <Code lang="bash">{REGISTER}</Code>
            <p><strong className="text-zinc-100">2. 提问。</strong></p>
            <Code lang="bash">{ASK_ZH}</Code>
            <p>
              <strong className="text-zinc-100">3. 轮询回复。</strong>每 2 到 3 秒调用一次 <C>GetTask</C>，直到状态不再是{" "}
              <C>TASK_STATE_SUBMITTED</C> 或 <C>TASK_STATE_WORKING</C>。回复在 <C>result.status.message</C> 里。
            </p>
            <Code lang="bash">{POLL}</Code>
          </Section>

          <Section id="authentication" title="鉴权">
            <p>
              每次请求 <C>/a2a</C> 都要带 <C>Authorization: Bearer &lt;token&gt;</C>。令牌免费，每个安装实例单独一个：生成一个
              UUID 作为 <C>install_id</C>，然后验证邮箱，或者在浏览器里批准这个安装实例。
            </p>
            <H3>邮箱验证码</H3>
            <Endpoint
              labels={EP_LABELS}
              route="POST /a2a/register"
              body={<span><C>install_id</C>（你生成的 UUID）、<C>email</C></span>}
              returns={<span><C>200</C> <C>{"{\"status\": \"code_sent\", \"install_id\": \"...\", \"expires_in\": 600, \"next\": {...}}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>install_id must be a UUID</C> 或 <C>invalid_email</C></span>,
                <span key="2"><C>409</C> <C>install_id already registered</C></span>,
                <span key="3"><C>429</C> <C>rate_limited</C></span>,
                <span key="4"><C>503</C> <C>registration_unavailable</C> 或 <C>mail_unavailable</C></span>,
              ]}
            />
            <Endpoint
              labels={EP_LABELS}
              route="POST /a2a/register/verify"
              body={<span><C>install_id</C>、<C>email</C>、<C>code</C></span>}
              returns={<span><C>200</C> <C>{"{\"install_id\": \"...\", \"token\": \"...\", \"token_type\": \"Bearer\"}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>expired_code</C> 或 <C>incorrect_code</C>（以及上面的请求体错误）</span>,
                <span key="2"><C>403</C> <C>account_blocked</C></span>,
                <span key="3"><C>409</C> <C>install_id already registered</C></span>,
                <span key="4"><C>429</C> <C>rate_limited</C></span>,
                <span key="5"><C>503</C> <C>registration_unavailable</C></span>,
              ]}
            />
            <p>验证码是 6 位数字，10 分钟内有效，输错 5 次作废。可以请使用者把验证码告诉你，也可以改用设备授权。</p>
            <H3>设备授权</H3>
            <p>
              适合使用者能打开链接的场合：对方用 GitHub 或邮箱验证码登录，然后批准这个安装实例。每个账户都必须有已验证的邮箱：GitHub
              登录时读取公开邮箱或已验证的主邮箱；GitHub 上没有时，使用者先填写邮箱并用验证码确认，再批准。
            </p>
            <Endpoint
              labels={EP_LABELS}
              route="POST /api/device/start"
              body={<span><C>install_id</C>（你生成的 UUID）、<C>label</C>（可选，最多 80 个字符）</span>}
              returns={<span><C>200</C> <C>{"{\"device_code\", \"user_code\", \"verification_uri\", \"expires_in\": 600, \"interval\": 3}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>install_id must be a UUID</C></span>,
                <span key="2"><C>409</C> <C>install_id already registered</C></span>,
                <span key="3"><C>429</C> <C>rate_limited</C></span>,
              ]}
            />
            <Endpoint
              labels={EP_LABELS}
              route="POST /api/device/token"
              body={<C>device_code</C>}
              returns={<span><C>200</C> <C>{"{\"token\", \"token_type\": \"Bearer\", \"install_id\", \"expires_in\"}"}</C></span>}
              errors={[
                <span key="1"><C>428</C> <C>authorization_pending</C>：还没批准，继续轮询</span>,
                <span key="2"><C>400</C> <C>expired_token</C>：设备码已过期或已用过</span>,
              ]}
            />
            <Code lang="bash">{DEVICE}</Code>
            <H3>令牌有效期</H3>
            <p>
              设备授权得到的令牌 90 天不用就失效；邮箱验证得到的令牌不会按时间失效。设备令牌可以在
              <a href="/me" className="text-radeon-500 hover:text-radeon-600">账户</a>页吊销。
            </p>
          </Section>

          <Section id="requests" title="请求">
            <Table
              head={["请求头", "值"]}
              rows={[
                [<C key="1">Authorization</C>, <C key="2">Bearer &lt;token&gt;</C>],
                [<C key="1">Content-Type</C>, <C key="2">application/json</C>],
                [<C key="1">A2A-Version</C>, <C key="2">1.0</C>],
              ]}
            />
            <p>
              请求体最大 64 KB。请从服务器或本地进程调用：<C>/a2a</C> 不返回 CORS 头，其他域名的网页无法直接调用。
            </p>
            <H3>SendMessage</H3>
            <Table
              head={["参数", "类型", "说明"]}
              rows={[
                [<C key="1">message.messageId</C>, "string", "每条消息唯一"],
                [<C key="1">message.role</C>, "string", <C key="3">ROLE_USER</C>],
                [<C key="1">message.parts</C>, "array", <span key="3">一个带 <C>action</C> 的 <C>data</C> 部件（见<a href="#actions" className="text-radeon-500 hover:text-radeon-600">动作</a>），可再加一个 <C>text</C> 部件。</span>],
                [<span key="1"><C>message.taskId</C>、<C>message.contextId</C></span>, "string", "两个都填，表示继续已有任务"],
                [<C key="1">configuration.returnImmediately</C>, "boolean", <span key="3">建议设为 true：立即返回任务，再用 <C>GetTask</C> 轮询。</span>],
              ]}
            />
            <p>返回 <C>result.task</C>。</p>
            <H3>GetTask</H3>
            <Table head={["参数", "类型", "说明"]} rows={[[<C key="1">id</C>, "string", "任务 id"]]} />
            <p>返回的 <C>result</C> 就是任务本身。轮询不计入消息限频。</p>
          </Section>

          <Section id="actions" title="动作">
            <p>
              把动作和字段放进 data 部件。请务必设置 <C>action</C>：新任务里没有 <C>action</C> 时按 <C>start</C> 处理。请求的
              Schema 是 <a href={API.requestSchema} className="text-radeon-500 hover:text-radeon-600">request.v1.json</a>。
            </p>
            <Table
              head={["action", "任务", "字段", "回复"]}
              rows={[
                [<C key="1">ask</C>, "新任务", <span key="3"><C>question</C>（必填，最多 4,000 字符）、<C>profile</C></span>, <span key="4"><C>radeonrun.answer/v1</C> 或 <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">troubleshoot</C>, "新任务", <span key="3"><C>error_text</C>（必填，取最后 4,096 个字符）、<C>context</C>（最多 2,000）、<C>profile</C></span>, <span key="4"><C>radeonrun.fix/v1</C> 或 <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">start</C>, "新任务", <span key="3"><C>profile</C>（必填）、<C>need</C>（必填：要运行的模型或任务，最多 2,000）</span>, <span key="4"><C>radeonrun.plan/v1</C> 或 <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">search_knowledge</C>, "单独的新任务", <span key="3"><C>query</C>（必填，最多 16,000）</span>, <span key="4"><C>radeonrun.knowledge/v1</C>。不调用模型，任务随即结束。</span>],
                [<C key="1">answer</C>, "同一任务", <span key="3"><C>text</C>（必填，最多 4,000）</span>, "同类型的下一条回复"],
                [<C key="1">report_issue</C>, "同一任务", <span key="3"><C>error_text</C>（必填）、<C>step_id</C>（方案步骤，如 <C>s2</C>）、<C>profile</C></span>, <span key="4"><C>radeonrun.fix/v1</C> 或 <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">report_result</C>, "同一任务", <span key="3"><C>success</C>（必填，布尔值）、<C>note</C>（最多 1,000）</span>, <span key="4"><C>radeonrun.result/v1</C>，任务随即结束。</span>],
              ]}
            />
            <p>没标必填的字段都是可选的。在已有任务里，只带 text 部件的消息按追问处理。</p>
            <H3 id="language">回复语言</H3>
            <p>
              任何动作都可以带 <C>language</C>：<C>en</C> 为英文，<C>zh</C> 为简体中文。它决定回复的语言，包括引用标签和已知问题修复步骤。设置后在同一任务里一直有效，直到再次指定。不指定时，按你提问所用的语言回复。其他取值返回
              <C>invalid_language</C>。字段名、Schema 名、枚举值和错误码在所有语言下都相同。
            </p>
            <H3>示例</H3>
            <Code lang="json">{EXAMPLES_ZH}</Code>
            <p>在同一任务里追问：</p>
            <Code lang="json">{FOLLOW_UP}</Code>
            <H3 id="profile">profile 对象</H3>
            <Code lang="json">{PROFILE}</Code>
            <p>
              <C>gfx</C> 是 GPU 架构代号，如 <C>gfx1151</C> 或 <C>gfx1201</C>，最多 16 块 GPU。profile 的字段都是可选的，给得越全，助手追问越少。
            </p>
          </Section>

          <Section id="responses" title="回复">
            <Table
              head={["状态", "含义"]}
              rows={[
                [<span key="1"><C>TASK_STATE_SUBMITTED</C>、<C>TASK_STATE_WORKING</C></span>, "还在处理，继续轮询。"],
                [<C key="1">TASK_STATE_INPUT_REQUIRED</C>, "回复已就绪，可以在同一任务里继续追问。"],
                [<C key="1">TASK_STATE_COMPLETED</C>, <span key="2">已结束（<C>search_knowledge</C>、<C>report_result</C>）。</span>],
                [<C key="1">TASK_STATE_REJECTED</C>, "被拒绝或请求无效，请新开任务。"],
              ]}
            />
            <p>
              回复在 <C>task.status.message.parts</C> 里：一个 text 部件是便于阅读的摘要，一个 data 部件的 <C>schema</C> 字段标明类型。程序请读取 data 部件。
            </p>
            <Code lang="json">{TASK}</Code>
            <p>错误回复的结构相同：</p>
            <Code lang="json">{ERROR}</Code>
          </Section>

          <Section id="data-types" title="数据类型">
            <Table
              head={["schema", "字段"]}
              rows={[
                [<C key="1">radeonrun.answer/v1</C>, <span key="2"><C>answer</C>（Markdown）、<C>confidence</C>（<C>high</C>、<C>medium</C>、<C>low</C> 或 null）、<C>citations</C> [<C>uri</C>, <C>citation</C>, <C>title</C>]、<C>sources</C> [<C>url</C>, <C>note</C>]、<C>fallback</C>（写不出回答、改为列出最接近的知识条目时为 true）</span>],
                [<C key="1">radeonrun.fix/v1</C>, <span key="2"><C>diagnosis</C>、<C>fixes</C> [<C>id</C>, <C>label</C>, <C>steps</C>, <C>new_plan</C>]、<C>verified</C>（已知问题时为 true）、<C>issue_id</C>、<C>confidence</C>、<C>sources</C>、<C>also_matched</C>、<C>step_id</C>；同一方案步骤失败三次后另有 <C>escalate</C> [<C>message</C>, <C>url</C>, <C>draft</C>]</span>],
                [<C key="1">radeonrun.plan/v1</C>, <span key="2"><C>title</C>、<C>summary</C>、<C>engine</C>、<C>model</C>、<C>quantization</C>、<C>method</C>、<C>steps</C> [<C>id</C>, <C>title</C>, <C>run</C>, <C>expect</C>, <C>needs_admin</C>]、<C>endpoint</C> [<C>base_url</C>, <C>model</C>, <C>api_key</C>]、<C>notes</C>、<C>based_on</C>（Radeon Arena 配方 id）、<C>sources</C></span>],
                [<C key="1">radeonrun.need_info/v1</C>, <span key="2"><C>questions</C>、<C>step_id</C>。在同一任务里用 <C>answer</C> 回答。</span>],
                [<C key="1">radeonrun.knowledge/v1</C>, <span key="2"><C>status</C>（<C>matched</C>、<C>no_match</C>、<C>not_configured</C>、<C>unavailable</C>）、<C>matches</C> [<C>id</C>, <C>title</C>, <C>excerpt</C>, <C>truncated</C>, <C>source</C>]、<C>guidance</C></span>],
                [<C key="1">radeonrun.result/v1</C>, <C key="2">recorded</C>],
                [<C key="1">radeonrun.error/v1</C>, <span key="2"><C>error</C>；限额类错误另有 <C>retry_after</C>、<C>limit</C> 和 <C>next_action</C></span>],
                [<C key="1">radeonrun.refused/v1</C>, <span key="2"><C>reason</C>（<C>off_topic</C>）、<C>message</C></span>],
              ]}
            />
            <p>步骤都有 <C>title</C>，适用时还有 <C>run</C>（要执行的命令）、<C>expect</C>（成功时应看到什么）和 <C>needs_admin</C>。</p>
          </Section>

          <Section id="schemas" title="JSON Schema">
            <p>两份 Schema 都用 JSON Schema draft 2020-12，由 API 服务自己提供，所以总是与正在运行的版本一致。</p>
            <Table
              head={["Schema", "描述的内容"]}
              rows={[
                [<CodeLink key="1" href={API.requestSchema}>request.v1.json</CodeLink>, "你发送的 data 部件，每个动作一个定义，含 profile 对象和 language"],
                [<CodeLink key="1" href={API.replySchema}>reply.v1.json</CodeLink>, <span key="2">每条回复的 data 部件。顶层匹配任意回复类型，各类型在 <C>$defs</C> 下。</span>],
              ]}
            />
            <Code lang="python">{VALIDATE}</Code>
          </Section>

          <Section id="errors" title="错误">
            <H3>HTTP</H3>
            <Table
              head={["状态码", "何时出现"]}
              rows={[
                [<C key="1">401</C>, <span key="2">缺少令牌或令牌无效。响应体：<C>{"{\"jsonrpc\": \"2.0\", \"id\": null, \"error\": {\"code\": -32001, \"message\": \"unauthorized\"}}"}</C></span>],
                [<C key="1">413</C>, "请求体超过 64 KB"],
                [<C key="1">429</C>, <span key="2">同一 IP 每分钟超过 60 个 POST 请求，带 <C>Retry-After: 60</C>。</span>],
              ]}
            />
            <H3>任务内错误</H3>
            <p>以下错误放在 <C>radeonrun.error/v1</C> 的 data 部件里返回。</p>
            <Table
              head={["error", "含义"]}
              rows={[
                [<C key="1">authentication_required</C>, "令牌没有关联到已验证的账户"],
                [<C key="1">rate_limited</C>, <span key="2">每分钟超过 30 条消息，<C>retry_after</C> 秒后重试。</span>],
                [<C key="1">server_busy</C>, <span key="2">助手繁忙，<C>retry_after</C> 秒后重试。</span>],
                [<C key="1">invalid_question</C>, <span key="2"><C>ask</C> 没有带问题</span>],
                [<C key="1">invalid_error_text</C>, <span key="2"><C>troubleshoot</C> 或 <C>report_issue</C> 没有带报错内容</span>],
                [<C key="1">invalid_knowledge_query</C>, "查询为空或超过 16,000 字符"],
                [<C key="1">invalid_language</C>, <span key="2"><C>language</C> 不是 <C>en</C> 或 <C>zh</C></span>],
                [<C key="1">invalid_profile</C>, <span key="2"><C>profile</C> 不是对象，或超过 16 块 GPU</span>],
                [<C key="1">unknown_action</C>, <span key="2"><C>action</C> 不在上面的列表里</span>],
                [<C key="1">new_knowledge_task_required</C>, <span key="2"><C>search_knowledge</C> 发到了已有任务里</span>],
                [<C key="1">session_already_started</C>, <span key="2">向已开始的任务发送了新任务类动作；请用 <C>answer</C> 继续</span>],
                [<C key="1">session_not_found</C>, "任务不存在，或属于其他安装实例"],
                [<span key="1"><C>plan_unavailable</C>、<C>answer_unavailable</C></span>, "没能生成方案或回答，请稍后重试。"],
              ]}
            />
            <p>与在 AMD 硬件上做 AI 无关的请求，返回 <C>radeonrun.refused/v1</C>，原因为 <C>off_topic</C>。</p>
          </Section>

          <Section id="limits" title="限额">
            <ul className="list-disc space-y-1 pl-5">
              <li>每个账户每分钟 30 条消息。追问计入，<C>GetTask</C> 轮询不计入。</li>
              <li>不限会话数、每日次数和轮数。</li>
              <li>每个 IP 对 <C>/a2a</C> 每分钟最多 60 个 POST 请求，突发上限 30。<C>GetTask</C> 也是 POST，请每 2 到 3 秒轮询一次。</li>
              <li>请求体最大 64 KB。</li>
            </ul>
          </Section>

          <Section id="data-handling" title="数据处理">
            <p>
              助手会把每个任务的问题、追问、回复和上报结果保存在你的账户下。保存前，会把问题、报错和追问里常见的 API 令牌、Authorization
              头、key 和 password 赋值、IPv4 地址以及 <C>/home</C> 下的用户名打码。请不要发送其他机密或个人信息。你可以在
              <a href="/me" className="text-radeon-500 hover:text-radeon-600">账户</a>页导出或删除自己的数据。详见
              <Link href="/zh/privacy" className="text-radeon-500 hover:text-radeon-600">隐私政策</Link>和
              <Link href="/zh/data-policy" className="text-radeon-500 hover:text-radeon-600">数据政策</Link>。
            </p>
          </Section>

          <Section id="agent-card" title="Agent Card">
            <p>
              <CodeLink href={API.agentCard}>GET /.well-known/agent-card.json</CodeLink>{" "}
              以机器可读的形式描述接口地址、技能、注册步骤和 Schema 链接，每个技能附一个请求示例。支持 A2A 的 Agent 可以从它开始接入。
            </p>
          </Section>

          <Section id="versioning" title="版本">
            <p>
              当前 API 版本以 Agent Card 为准。数据类型的版本写在 schema 名里，如 <C>radeonrun.answer/v1</C>；Schema
              文件的版本写在文件名里。下表没有列出的版本只改了服务端，没有改接口。
            </p>
            <Table
              head={["版本", "变化"]}
              rows={[
                [<C key="1">0.2.8</C>, "每个账户都必须有已验证的邮箱。GitHub 登录读取公开邮箱或已验证的主邮箱；没有时，使用者先用验证码确认邮箱，才能批准设备。不收集手机号。"],
                [<C key="1">0.2.4</C>, "知识库还收录 AMD 公开文档（ROCm 文档与博客、ROCm CLI、AMD Skills、AMD AI Playbooks 等），每天更新。这些条目的引用链接到原始页面。"],
                [<C key="1">0.2.2</C>, <span key="2">部署方案以跑通接口为目标，不再引用实测 tok/s，也不再包含跑分或调优步骤。</span>],
                [<C key="1">0.2.1</C>, <span key="2">参考配方每 15 分钟从已发布的榜单刷新。<C>based_on</C> 里的配方 id 跨设备唯一：与 Strix Halo 结果同名的其他设备结果加设备后缀，如 <C>qwen3-14b-bf16-llamacpp-w7900</C>。</span>],
                [<C key="1">0.2.0</C>, <span key="2">新增 <C>language</C> 选项；错误码改为固定标识；提供 JSON Schema；Agent Card 附请求示例。</span>],
                [<C key="1">0.1.0</C>, "部署方案、问答、排障和知识检索。"],
              ]}
            />
            <p className="text-sm text-zinc-500">
              另见：<a href={API.skillsRepo} className="text-radeon-500 hover:text-radeon-600">radeon-arena/skills</a> 和{" "}
              <a href={API.mcpRepo} className="text-radeon-500 hover:text-radeon-600">radeon-arena/mcp</a> 是在本机配置和诊断 AMD 显卡的工具，不调用这个 API。
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}
