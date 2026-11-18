import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { API } from "@/lib/site";

export const metadata: Metadata = {
  title: "API Docs - Radeon Arena",
  description:
    "Call the AMD GPU Support Agent over A2A JSON-RPC: authentication, actions, JSON Schemas, reply types, errors and limits.",
};

const TOC = [
  ["overview", "Overview"],
  ["quickstart", "Quickstart"],
  ["authentication", "Authentication"],
  ["requests", "Requests"],
  ["actions", "Actions"],
  ["responses", "Responses"],
  ["data-types", "Data types"],
  ["schemas", "JSON Schemas"],
  ["errors", "Errors"],
  ["limits", "Limits"],
  ["data-handling", "Data handling"],
  ["agent-card", "Agent Card"],
  ["versioning", "Versioning"],
] as const;

function C({ children }: { children: ReactNode }) {
  return <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[0.85em] text-zinc-200">{children}</code>;
}

function CodeLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[0.85em] text-radeon-600 underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

function Endpoint({ route, body, returns, errors }: { route: string; body: ReactNode; returns: ReactNode; errors: ReactNode[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-700">
      <div className="border-b border-ink-700 bg-ink-850 px-3 py-2 font-mono text-[13px] font-medium text-zinc-100">{route}</div>
      <dl className="grid gap-x-4 gap-y-2 px-3 py-3 text-sm sm:grid-cols-[5rem_minmax(0,1fr)]">
        <dt className="text-zinc-500">Body</dt>
        <dd>{body}</dd>
        <dt className="text-zinc-500">Returns</dt>
        <dd>{returns}</dd>
        <dt className="text-zinc-500">Errors</dt>
        <dd>
          <ul className="space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </dd>
      </dl>
    </div>
  );
}

function Code({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-700 bg-ink-850">
      <div className="border-b border-ink-700 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
        {lang}
      </div>
      <pre className="thin-scroll overflow-x-auto p-4 font-mono text-[13px] leading-6 text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Table({ head, rows }: { head?: string[]; rows: ReactNode[][] }) {
  return (
    <div className="thin-scroll mt-3 overflow-x-auto rounded-lg border border-ink-700">
      <table className="w-full text-left text-sm">
        {head && (
          <thead className="bg-ink-850 text-zinc-500">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`${head || i > 0 ? "border-t border-ink-700" : ""} align-top`}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-zinc-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-ink-700 pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-zinc-300">{children}</div>
    </section>
  );
}

function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-20 pt-4 text-lg font-semibold text-zinc-100">
      {children}
    </h3>
  );
}

const REGISTER = `INSTALL_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
curl -s https://radeon-arena.com/a2a/register \\
  -H 'Content-Type: application/json' \\
  -d "{\\"install_id\\":\\"$INSTALL_ID\\",\\"email\\":\\"you@example.com\\"}"

# After the code arrives:
curl -s https://radeon-arena.com/a2a/register/verify \\
  -H 'Content-Type: application/json' \\
  -d "{\\"install_id\\":\\"$INSTALL_ID\\",\\"email\\":\\"you@example.com\\",\\"code\\":\\"123456\\"}"
# => {"install_id": "...", "token": "...", "token_type": "Bearer"}`;

const ASK = `# TOKEN is the token from step 1.
MSG_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
curl -s https://radeon-arena.com/a2a \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'A2A-Version: 1.0' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc": "2.0", "id": 1, "method": "SendMessage", "params": {
        "message": {"messageId": "'"$MSG_ID"'", "role": "ROLE_USER",
          "parts": [{"data": {"action": "ask", "language": "en",
            "question": "How do I check that PyTorch can see my Radeon GPU on Ubuntu?"}}]},
        "configuration": {"returnImmediately": true}}}'
# => result.task with its id, contextId and status`;

const POLL = `curl -s https://radeon-arena.com/a2a \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'A2A-Version: 1.0' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc": "2.0", "id": 2, "method": "GetTask", "params": {"id": "TASK_ID"}}'`;

const DEVICE = `INSTALL_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
curl -s https://radeon-arena.com/api/device/start \\
  -H 'Content-Type: application/json' \\
  -d "{\\"install_id\\":\\"$INSTALL_ID\\",\\"label\\":\\"my agent\\"}"
# => {"device_code": "radc_...", "user_code": "ABCD-EFGH",
#     "verification_uri": "https://radeon-arena.com/device?code=ABCD-EFGH",
#     "expires_in": 600, "interval": 3}

# Show verification_uri to the person, then poll every 3 seconds:
curl -s https://radeon-arena.com/api/device/token \\
  -H 'Content-Type: application/json' \\
  -d '{"device_code": "radc_..."}'
# => 428 {"error": "authorization_pending"} until approved, then
#    {"token": "...", "token_type": "Bearer", "install_id": "...", "expires_in": 7776000}`;

const FOLLOW_UP = `{"jsonrpc": "2.0", "id": 3, "method": "SendMessage", "params": {
  "message": {"messageId": "...", "role": "ROLE_USER",
    "taskId": "TASK_ID", "contextId": "CONTEXT_ID",
    "parts": [{"data": {"action": "answer", "text": "It is Ubuntu 24.04 with ROCm 7.2.1."}}]},
  "configuration": {"returnImmediately": true}}}`;

const EXAMPLES = `{"action": "ask", "question": "Which ROCm release supports gfx1151?", "language": "en"}

{"action": "troubleshoot", "error_text": "RuntimeError: No HIP GPUs are available",
 "context": "WSL2 with the ROCm build of PyTorch", "language": "en"}

{"action": "start", "need": "Run Qwen3-8B with llama.cpp behind an OpenAI-compatible endpoint",
 "profile": {"hardware": {"gpus": [{"gfx": "gfx1151"}]}, "software": {"os": "ubuntu 24.04"}},
 "language": "en"}

{"action": "search_knowledge", "query": "gfx1151 GTT memory", "language": "en"}

{"action": "report_issue", "step_id": "s2",
 "error_text": "docker: permission denied while trying to connect to the docker daemon socket"}

{"action": "report_result", "success": true, "note": "The endpoint answers requests"}`;

const PROFILE = `{
  "hardware": {
    "gpus": [{"gfx": "gfx1151", "name": "Radeon 8060S", "memory_gb": 96,
              "unified_memory": true}],
    "system_memory_gb": 128
  },
  "software": {"os": "ubuntu 24.04", "kernel": "6.14", "rocm": "7.2.1", "docker": "28.0",
               "kfd_access": true, "disk_free_gb": 500}
}`;

const TASK = `{
  "id": "TASK_ID",
  "contextId": "CONTEXT_ID",
  "status": {
    "state": "TASK_STATE_INPUT_REQUIRED",
    "timestamp": "...",
    "message": {
      "messageId": "...", "role": "ROLE_AGENT", "taskId": "TASK_ID", "contextId": "CONTEXT_ID",
      "parts": [
        {"text": "**Short answer:** Keep the BIOS UMA carve-out at 512 MB. ...\\nCitation: ..."},
        {"data": {
          "schema": "radeonrun.answer/v1",
          "answer": "**Short answer:** Keep the BIOS UMA carve-out at 512 MB. ...",
          "confidence": "medium",
          "citations": [{
            "uri": "urn:radeon-arena:knowledge:amd-rocm-faq:s11:q083",
            "citation": "Official AMD ROCm community support FAQ, section 11, question 83, PDF page 309",
            "title": "..."}],
          "sources": [{
            "url": "https://rocm.docs.amd.com/en/latest/reference/system-optimization/rdna3-5.html",
            "note": "..."}]
        }}
      ]
    }
  },
  "history": [...]
}`;

const ERROR = `"parts": [
  {"text": "Send the question text."},
  {"data": {"schema": "radeonrun.error/v1", "error": "invalid_question"}}
]`;

const VALIDATE = `# pip install jsonschema httpx
import httpx, jsonschema

reply_schema = httpx.get("${API.replySchema}").json()
# task is the result of GetTask
data = next(p["data"] for p in task["status"]["message"]["parts"] if "data" in p)
jsonschema.validate(data, reply_schema)  # raises ValidationError if the reply does not match`;

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-20 text-sm">
            <p className="mb-2 font-semibold text-zinc-100">On this page</p>
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
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">API Docs</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-400">
              Use the Radeon Arena API to reach the AMD GPU Support Agent from your application or AI agent. It
              answers questions about AI on AMD GPUs, Ryzen AI and ROCm, diagnoses errors, writes local LLM
              deployment plans and searches the support knowledge base. Answers cite the official AMD ROCm
              community support FAQ.
            </p>
            <nav aria-label="On this page" className="mt-6 lg:hidden">
              <p className="text-sm font-semibold text-zinc-100">On this page</p>
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
                ["Protocol", "A2A 1.0, JSON-RPC 2.0 over HTTPS"],
                ["Endpoint", <C key="e">POST {API.endpoint}</C>],
                ["Agent Card", <CodeLink key="a" href={API.agentCard}>GET /.well-known/agent-card.json</CodeLink>],
                ["Input and output", "Structured JSON: a data part with an action in, a data part with a schema out"],
                ["JSON Schemas", <span key="s"><CodeLink href={API.requestSchema}>request.v1.json</CodeLink>{" "}<CodeLink href={API.replySchema}>reply.v1.json</CodeLink></span>],
                ["Authentication", "Bearer token from a free account"],
                ["Rate limit", "30 messages per minute per account"],
                ["Reply language", <span key="l"><C>language</C>: <C>en</C> or <C>zh</C>, set in any request</span>],
                ["Streaming, push notifications", <span key="p">Not supported. Poll with <C>GetTask</C>.</span>],
              ]}
            />
          </header>

          <Section id="quickstart" title="Quickstart">
            <p><strong className="text-zinc-100">1. Get a token.</strong> Generate a UUID as <C>install_id</C>, then verify your email address.</p>
            <Code lang="bash">{REGISTER}</Code>
            <p><strong className="text-zinc-100">2. Ask a question.</strong></p>
            <Code lang="bash">{ASK}</Code>
            <p>
              <strong className="text-zinc-100">3. Poll for the reply.</strong> Call <C>GetTask</C> every 2 to 3 seconds
              until the state is no longer <C>TASK_STATE_SUBMITTED</C> or <C>TASK_STATE_WORKING</C>. The reply is in{" "}
              <C>result.status.message</C>.
            </p>
            <Code lang="bash">{POLL}</Code>
          </Section>

          <Section id="authentication" title="Authentication">
            <p>
              Send <C>Authorization: Bearer &lt;token&gt;</C> with every request to <C>/a2a</C>. Tokens are free. Each
              install gets its own token: generate a UUID as <C>install_id</C>, then verify an email address or approve
              the install in a browser.
            </p>
            <H3>Email code</H3>
            <Endpoint
              route="POST /a2a/register"
              body={<span><C>install_id</C> (a UUID you generate), <C>email</C></span>}
              returns={<span><C>200</C> <C>{"{\"status\": \"code_sent\", \"install_id\": \"...\", \"expires_in\": 600, \"next\": {...}}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>install_id must be a UUID</C> or <C>invalid_email</C></span>,
                <span key="2"><C>409</C> <C>install_id already registered</C></span>,
                <span key="3"><C>429</C> <C>rate_limited</C></span>,
                <span key="4"><C>503</C> <C>registration_unavailable</C> or <C>mail_unavailable</C></span>,
              ]}
            />
            <Endpoint
              route="POST /a2a/register/verify"
              body={<span><C>install_id</C>, <C>email</C>, <C>code</C></span>}
              returns={<span><C>200</C> <C>{"{\"install_id\": \"...\", \"token\": \"...\", \"token_type\": \"Bearer\"}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>expired_code</C> or <C>incorrect_code</C> (or the body errors above)</span>,
                <span key="2"><C>403</C> <C>account_blocked</C></span>,
                <span key="3"><C>409</C> <C>install_id already registered</C></span>,
                <span key="4"><C>429</C> <C>rate_limited</C></span>,
                <span key="5"><C>503</C> <C>registration_unavailable</C></span>,
              ]}
            />
            <p>The code has 6 digits and expires after 10 minutes. Five wrong attempts invalidate it. Ask the person for the code, or use device authorization.</p>
            <H3>Device authorization</H3>
            <p>Use this when a person can open a link. They sign in with GitHub and approve the install.</p>
            <Endpoint
              route="POST /api/device/start"
              body={<span><C>install_id</C> (a UUID you generate), <C>label</C> (optional, up to 80 characters)</span>}
              returns={<span><C>200</C> <C>{"{\"device_code\", \"user_code\", \"verification_uri\", \"expires_in\": 600, \"interval\": 3}"}</C></span>}
              errors={[
                <span key="1"><C>400</C> <C>install_id must be a UUID</C></span>,
                <span key="2"><C>409</C> <C>install_id already registered</C></span>,
                <span key="3"><C>429</C> <C>rate_limited</C></span>,
              ]}
            />
            <Endpoint
              route="POST /api/device/token"
              body={<C>device_code</C>}
              returns={<span><C>200</C> <C>{"{\"token\", \"token_type\": \"Bearer\", \"install_id\", \"expires_in\"}"}</C></span>}
              errors={[
                <span key="1"><C>428</C> <C>authorization_pending</C>: not approved yet, poll again</span>,
                <span key="2"><C>400</C> <C>expired_token</C>: the device code expired or was used</span>,
              ]}
            />
            <Code lang="bash">{DEVICE}</Code>
            <H3>Token lifetime</H3>
            <p>
              Tokens from device authorization expire after 90 days without use. Tokens from email verification do not
              expire on a schedule. You can revoke device tokens on the <a href="/me" className="text-radeon-500 hover:text-radeon-600">Account</a> page.
            </p>
          </Section>

          <Section id="requests" title="Requests">
            <Table
              head={["Header", "Value"]}
              rows={[
                [<C key="1">Authorization</C>, <C key="2">Bearer &lt;token&gt;</C>],
                [<C key="1">Content-Type</C>, <C key="2">application/json</C>],
                [<C key="1">A2A-Version</C>, <C key="2">1.0</C>],
              ]}
            />
            <p>
              Request bodies are limited to 64 KB. Call the API from a server or a local process: <C>/a2a</C> does not
              send CORS headers, so browsers on other origins cannot call it.
            </p>
            <H3>SendMessage</H3>
            <Table
              head={["Param", "Type", "Notes"]}
              rows={[
                [<C key="1">message.messageId</C>, "string", "Unique per message"],
                [<C key="1">message.role</C>, "string", <C key="3">ROLE_USER</C>],
                [<C key="1">message.parts</C>, "array", <span key="3">One <C>data</C> part with an <C>action</C> (see <a href="#actions" className="text-radeon-500 hover:text-radeon-600">Actions</a>). An optional <C>text</C> part.</span>],
                [<span key="1"><C>message.taskId</C>, <C>message.contextId</C></span>, "string", "Set both to continue an existing task"],
                [<C key="1">configuration.returnImmediately</C>, "boolean", <span key="3">Recommended. Returns the task at once; then poll <C>GetTask</C>.</span>],
              ]}
            />
            <p>Returns <C>result.task</C>.</p>
            <H3>GetTask</H3>
            <Table head={["Param", "Type", "Notes"]} rows={[[<C key="1">id</C>, "string", "The task id"]]} />
            <p>Returns the task as <C>result</C>. Polling does not count toward the message limit.</p>
          </Section>

          <Section id="actions" title="Actions">
            <p>
              Put the action and its fields in the data part. Always set <C>action</C>: a new task without one is treated
              as <C>start</C>. The request schema is <a href={API.requestSchema} className="text-radeon-500 hover:text-radeon-600">request.v1.json</a>.
            </p>
            <Table
              head={["action", "Task", "Fields", "Reply"]}
              rows={[
                [<C key="1">ask</C>, "New", <span key="3"><C>question</C> (required, up to 4,000 characters), <C>profile</C></span>, <span key="4"><C>radeonrun.answer/v1</C> or <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">troubleshoot</C>, "New", <span key="3"><C>error_text</C> (required; the last 4,096 characters are used), <C>context</C> (up to 2,000), <C>profile</C></span>, <span key="4"><C>radeonrun.fix/v1</C> or <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">start</C>, "New", <span key="3"><C>profile</C> (required), <C>need</C> (required: the model or task to run, up to 2,000)</span>, <span key="4"><C>radeonrun.plan/v1</C> or <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">search_knowledge</C>, "New, on its own", <span key="3"><C>query</C> (required, up to 16,000)</span>, <span key="4"><C>radeonrun.knowledge/v1</C>. No model call. The task completes.</span>],
                [<C key="1">answer</C>, "Same task", <span key="3"><C>text</C> (required, up to 4,000)</span>, "The next reply of the same kind"],
                [<C key="1">report_issue</C>, "Same task", <span key="3"><C>error_text</C> (required), <C>step_id</C> (plan step such as <C>s2</C>), <C>profile</C></span>, <span key="4"><C>radeonrun.fix/v1</C> or <C>radeonrun.need_info/v1</C></span>],
                [<C key="1">report_result</C>, "Same task", <span key="3"><C>success</C> (required, boolean), <C>note</C> (up to 1,000)</span>, <span key="4"><C>radeonrun.result/v1</C>. The task completes.</span>],
              ]}
            />
            <p>Fields not marked required are optional. In an existing task, a message with only a text part is treated as a follow-up.</p>
            <H3 id="language">Reply language</H3>
            <p>
              Any action can include <C>language</C>: <C>en</C> for English or <C>zh</C> for Simplified Chinese. It sets
              the language of the reply, including citation labels and the steps of known-issue fixes. The task keeps it
              until you send another value. Without it, the agent replies in the language of your request. Other values
              return <C>invalid_language</C>. Field names, schema names, enum values and error codes are the same in
              every language.
            </p>
            <H3>Examples</H3>
            <Code lang="json">{EXAMPLES}</Code>
            <p>A follow-up in the same task:</p>
            <Code lang="json">{FOLLOW_UP}</Code>
            <H3 id="profile">Profile object</H3>
            <Code lang="json">{PROFILE}</Code>
            <p>
              <C>gfx</C> is the GPU target, such as <C>gfx1151</C> or <C>gfx1201</C>. Up to 16 GPUs. All profile fields
              are optional; the more you send, the fewer questions the agent asks.
            </p>
          </Section>

          <Section id="responses" title="Responses">
            <Table
              head={["State", "Meaning"]}
              rows={[
                [<span key="1"><C>TASK_STATE_SUBMITTED</C>, <C>TASK_STATE_WORKING</C></span>, "Still running. Poll again."],
                [<C key="1">TASK_STATE_INPUT_REQUIRED</C>, "A reply is ready. You can follow up in the same task."],
                [<C key="1">TASK_STATE_COMPLETED</C>, <span key="2">Finished (<C>search_knowledge</C>, <C>report_result</C>).</span>],
                [<C key="1">TASK_STATE_REJECTED</C>, "Refused or invalid. Start a new task."],
              ]}
            />
            <p>
              The reply is in <C>task.status.message.parts</C>: a text part with a readable summary and a data part whose{" "}
              <C>schema</C> field names its type. Read the data part in code.
            </p>
            <Code lang="json">{TASK}</Code>
            <p>An error reply has the same shape:</p>
            <Code lang="json">{ERROR}</Code>
          </Section>

          <Section id="data-types" title="Data types">
            <Table
              head={["schema", "Fields"]}
              rows={[
                [<C key="1">radeonrun.answer/v1</C>, <span key="2"><C>answer</C> (Markdown), <C>confidence</C> (<C>high</C>, <C>medium</C>, <C>low</C> or null), <C>citations</C> [<C>uri</C>, <C>citation</C>, <C>title</C>], <C>sources</C> [<C>url</C>, <C>note</C>], <C>fallback</C> (true when no answer could be written and the closest knowledge records are listed instead)</span>],
                [<C key="1">radeonrun.fix/v1</C>, <span key="2"><C>diagnosis</C>, <C>fixes</C> [<C>id</C>, <C>label</C>, <C>steps</C>, <C>new_plan</C>], <C>verified</C> (true for a known issue), <C>issue_id</C>, <C>confidence</C>, <C>sources</C>, <C>also_matched</C>, <C>step_id</C>, <C>escalate</C> [<C>message</C>, <C>url</C>, <C>draft</C>] after a plan step fails three times</span>],
                [<C key="1">radeonrun.plan/v1</C>, <span key="2"><C>title</C>, <C>summary</C>, <C>engine</C>, <C>model</C>, <C>quantization</C>, <C>method</C>, <C>steps</C> [<C>id</C>, <C>title</C>, <C>run</C>, <C>expect</C>, <C>needs_admin</C>], <C>endpoint</C> [<C>base_url</C>, <C>model</C>, <C>api_key</C>], <C>notes</C>, <C>based_on</C> (Radeon Arena recipe ids), <C>sources</C></span>],
                [<C key="1">radeonrun.need_info/v1</C>, <span key="2"><C>questions</C>, <C>step_id</C>. Answer in the same task with <C>answer</C>.</span>],
                [<C key="1">radeonrun.knowledge/v1</C>, <span key="2"><C>status</C> (<C>matched</C>, <C>no_match</C>, <C>not_configured</C>, <C>unavailable</C>), <C>matches</C> [<C>id</C>, <C>title</C>, <C>excerpt</C>, <C>truncated</C>, <C>source</C>], <C>guidance</C></span>],
                [<C key="1">radeonrun.result/v1</C>, <C key="2">recorded</C>],
                [<C key="1">radeonrun.error/v1</C>, <span key="2"><C>error</C>, plus <C>retry_after</C>, <C>limit</C> and <C>next_action</C> for limits</span>],
                [<C key="1">radeonrun.refused/v1</C>, <span key="2"><C>reason</C> (<C>off_topic</C>), <C>message</C></span>],
              ]}
            />
            <p>Steps carry <C>title</C> and, when they apply, <C>run</C> (the command), <C>expect</C> (what success looks like) and <C>needs_admin</C>.</p>
          </Section>

          <Section id="schemas" title="JSON Schemas">
            <p>Both schemas use JSON Schema draft 2020-12 and are served by the API itself, so they match the running version.</p>
            <Table
              head={["Schema", "Describes"]}
              rows={[
                [<CodeLink key="1" href={API.requestSchema}>request.v1.json</CodeLink>, "The data part you send, one definition per action, with the profile object and language"],
                [<CodeLink key="1" href={API.replySchema}>reply.v1.json</CodeLink>, <span key="2">The data part of every reply. The top level matches any reply type; each type is under <C>$defs</C>.</span>],
              ]}
            />
            <Code lang="python">{VALIDATE}</Code>
          </Section>

          <Section id="errors" title="Errors">
            <H3>HTTP</H3>
            <Table
              head={["Status", "When"]}
              rows={[
                [<C key="1">401</C>, <span key="2">Missing or invalid token. Body: <C>{"{\"jsonrpc\": \"2.0\", \"id\": null, \"error\": {\"code\": -32001, \"message\": \"unauthorized\"}}"}</C></span>],
                [<C key="1">413</C>, "Body over 64 KB"],
                [<C key="1">429</C>, <span key="2">Over 60 POST requests per minute from one IP address. <C>Retry-After: 60</C>.</span>],
              ]}
            />
            <H3>In the task</H3>
            <p>These come in a <C>radeonrun.error/v1</C> data part.</p>
            <Table
              head={["error", "Meaning"]}
              rows={[
                [<C key="1">authentication_required</C>, "The token is not linked to a verified account"],
                [<C key="1">rate_limited</C>, <span key="2">Over 30 messages per minute. Retry after <C>retry_after</C> seconds.</span>],
                [<C key="1">server_busy</C>, <span key="2">The agent is busy. Retry after <C>retry_after</C> seconds.</span>],
                [<C key="1">invalid_question</C>, <span key="2"><C>ask</C> without a question</span>],
                [<C key="1">invalid_error_text</C>, <span key="2"><C>troubleshoot</C> or <C>report_issue</C> without error text</span>],
                [<C key="1">invalid_knowledge_query</C>, "Empty query, or over 16,000 characters"],
                [<C key="1">invalid_language</C>, <span key="2"><C>language</C> is not <C>en</C> or <C>zh</C></span>],
                [<C key="1">invalid_profile</C>, <span key="2"><C>profile</C> is not an object, or lists more than 16 GPUs</span>],
                [<C key="1">unknown_action</C>, <span key="2"><C>action</C> is not one of the actions above</span>],
                [<C key="1">new_knowledge_task_required</C>, <span key="2"><C>search_knowledge</C> was sent inside an existing task</span>],
                [<C key="1">session_already_started</C>, <span key="2">A new-task action was sent to a task that has started; continue with <C>answer</C></span>],
                [<C key="1">session_not_found</C>, "The task does not exist or belongs to another install"],
                [<span key="1"><C>plan_unavailable</C>, <C>answer_unavailable</C></span>, "No plan or answer could be produced. Retry later."],
              ]}
            />
            <p>Requests unrelated to AI on AMD hardware return <C>radeonrun.refused/v1</C> with reason <C>off_topic</C>.</p>
          </Section>

          <Section id="limits" title="Limits">
            <ul className="list-disc space-y-1 pl-5">
              <li>30 messages per minute per account. Follow-ups count; <C>GetTask</C> polls do not.</li>
              <li>No session, daily or turn cap.</li>
              <li>60 POST requests per minute per IP address to <C>/a2a</C>, with bursts up to 30. <C>GetTask</C> is a POST, so poll every 2 to 3 seconds.</li>
              <li>Request bodies up to 64 KB.</li>
            </ul>
          </Section>

          <Section id="data-handling" title="Data handling">
            <p>
              The agent stores each task&apos;s questions, follow-ups, replies and reported outcomes with your account. In
              questions, error text and follow-ups, it masks common API tokens, Authorization headers, key and password
              assignments, IPv4 addresses and <C>/home</C> user names before storing them. Do not send other secrets or
              personal data. You can export or delete your data on the{" "}
              <a href="/me" className="text-radeon-500 hover:text-radeon-600">Account</a> page. See{" "}
              <Link href="/privacy" className="text-radeon-500 hover:text-radeon-600">Privacy</Link> and{" "}
              <Link href="/data-policy" className="text-radeon-500 hover:text-radeon-600">Data Policy</Link>.
            </p>
          </Section>

          <Section id="agent-card" title="Agent Card">
            <p>
              <CodeLink href={API.agentCard}>GET /.well-known/agent-card.json</CodeLink>{" "}
              describes the endpoint, skills, sign-up steps and schema links in machine-readable form, with an example
              request for each skill. Agents that support A2A can start from it.
            </p>
          </Section>

          <Section id="versioning" title="Versioning">
            <p>
              The Agent Card carries the API version. Data types carry their version in the schema name, such as{" "}
              <C>radeonrun.answer/v1</C>, and the schema files carry it in the file name.
            </p>
            <Table
              head={["Version", "Changes"]}
              rows={[
                [<C key="1">0.2.0</C>, <span key="2">The <C>language</C> option; error codes are stable identifiers; JSON Schemas; example requests in the Agent Card.</span>],
                [<C key="1">0.1.0</C>, "Deployment plans, questions, troubleshooting and knowledge search."],
              ]}
            />
            <p className="text-sm text-zinc-500">
              Related: <a href={API.skillsRepo} className="text-radeon-500 hover:text-radeon-600">radeon-arena/skills</a> and{" "}
              <a href={API.mcpRepo} className="text-radeon-500 hover:text-radeon-600">radeon-arena/mcp</a> are local tools for AMD GPU
              setup and diagnostics. They do not call this API.
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}
