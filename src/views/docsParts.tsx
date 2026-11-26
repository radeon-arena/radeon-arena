import type { ReactNode } from "react";
import { API } from "@/lib/site";

// Shared pieces of the English and Chinese API docs pages.

export function C({ children }: { children: ReactNode }) {
  return <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[0.85em] text-zinc-200">{children}</code>;
}

export function CodeLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[0.85em] text-radeon-600 underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

export function Endpoint({ route, body, returns, errors, labels = ["Body", "Returns", "Errors"] }: { route: string; body: ReactNode; returns: ReactNode; errors: ReactNode[]; labels?: [string, string, string] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-700">
      <div className="border-b border-ink-700 bg-ink-850 px-3 py-2 font-mono text-[13px] font-medium text-zinc-100">{route}</div>
      <dl className="grid gap-x-4 gap-y-2 px-3 py-3 text-sm sm:grid-cols-[5rem_minmax(0,1fr)]">
        <dt className="text-zinc-500">{labels[0]}</dt>
        <dd>{body}</dd>
        <dt className="text-zinc-500">{labels[1]}</dt>
        <dd>{returns}</dd>
        <dt className="text-zinc-500">{labels[2]}</dt>
        <dd>
          <ul className="space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </dd>
      </dl>
    </div>
  );
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function Code({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-700 bg-ink-850">
      <div className="border-b border-ink-700 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
        {lang}
      </div>
      <pre className="thin-scroll overflow-x-auto p-4 font-mono text-[13px] leading-6 text-zinc-200">
        {/* Cloudflare hides email addresses from readers without JavaScript; email_off keeps samples literal. */}
        <code dangerouslySetInnerHTML={{ __html: `<!--email_off-->${escapeHtml(children)}<!--/email_off-->` }} />
      </pre>
    </div>
  );
}

export function Table({ head, rows }: { head?: string[]; rows: ReactNode[][] }) {
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

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-ink-700 pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-zinc-300">{children}</div>
    </section>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-20 pt-4 text-lg font-semibold text-zinc-100">
      {children}
    </h3>
  );
}

export const REGISTER = `INSTALL_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
curl -s https://radeon-arena.com/a2a/register \\
  -H 'Content-Type: application/json' \\
  -d "{\\"install_id\\":\\"$INSTALL_ID\\",\\"email\\":\\"you@example.com\\"}"

# After the code arrives:
curl -s https://radeon-arena.com/a2a/register/verify \\
  -H 'Content-Type: application/json' \\
  -d "{\\"install_id\\":\\"$INSTALL_ID\\",\\"email\\":\\"you@example.com\\",\\"code\\":\\"123456\\"}"
# => {"install_id": "...", "token": "...", "token_type": "Bearer"}`;

export const ASK = `# TOKEN is the token from step 1.
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

export const POLL = `curl -s https://radeon-arena.com/a2a \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'A2A-Version: 1.0' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc": "2.0", "id": 2, "method": "GetTask", "params": {"id": "TASK_ID"}}'`;

export const DEVICE = `INSTALL_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
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

export const FOLLOW_UP = `{"jsonrpc": "2.0", "id": 3, "method": "SendMessage", "params": {
  "message": {"messageId": "...", "role": "ROLE_USER",
    "taskId": "TASK_ID", "contextId": "CONTEXT_ID",
    "parts": [{"data": {"action": "answer", "text": "It is Ubuntu 24.04 with ROCm 7.2.1."}}]},
  "configuration": {"returnImmediately": true}}}`;

export const EXAMPLES = `{"action": "ask", "question": "Which ROCm release supports gfx1151?", "language": "en"}

{"action": "troubleshoot", "error_text": "RuntimeError: No HIP GPUs are available",
 "context": "WSL2 with the ROCm build of PyTorch", "language": "en"}

{"action": "start", "need": "Run Qwen3-8B with llama.cpp behind an OpenAI-compatible endpoint",
 "profile": {"hardware": {"gpus": [{"gfx": "gfx1151"}]}, "software": {"os": "ubuntu 24.04"}},
 "language": "en"}

{"action": "search_knowledge", "query": "gfx1151 GTT memory", "language": "en"}

{"action": "report_issue", "step_id": "s2",
 "error_text": "docker: permission denied while trying to connect to the docker daemon socket"}

{"action": "report_result", "success": true, "note": "The endpoint answers requests"}`;

export const PROFILE = `{
  "hardware": {
    "gpus": [{"gfx": "gfx1151", "name": "Radeon 8060S", "memory_gb": 96,
              "unified_memory": true}],
    "system_memory_gb": 128
  },
  "software": {"os": "ubuntu 24.04", "kernel": "6.14", "rocm": "7.2.1", "docker": "28.0",
               "kfd_access": true, "disk_free_gb": 500}
}`;

export const TASK = `{
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

export const ERROR = `"parts": [
  {"text": "Send the question text."},
  {"data": {"schema": "radeonrun.error/v1", "error": "invalid_question"}}
]`;

export const VALIDATE = `# pip install jsonschema httpx
import httpx, jsonschema

reply_schema = httpx.get("${API.replySchema}").json()
# task is the result of GetTask
data = next(p["data"] for p in task["status"]["message"]["parts"] if "data" in p)
jsonschema.validate(data, reply_schema)  # raises ValidationError if the reply does not match`;


// Chinese page: same requests, comments and sample text in Chinese. Field names
// and values sent to the API are unchanged.
export const REGISTER_ZH = REGISTER.replace("# After the code arrives:", "# 收到验证码后：");
export const DEVICE_ZH = DEVICE.replace(
  "# Show verification_uri to the person, then poll every 3 seconds:",
  "# 把 verification_uri 给使用者打开，然后每 3 秒轮询一次：",
).replace(
  '# => 428 {"error": "authorization_pending"} until approved, then',
  '# => 批准前返回 428 {"error": "authorization_pending"}，批准后返回',
);
export const FOLLOW_UP_ZH = FOLLOW_UP.replace("It is Ubuntu 24.04 with ROCm 7.2.1.", "系统是 Ubuntu 24.04，ROCm 7.2.1。");
export const VALIDATE_ZH = VALIDATE.replace("# task is the result of GetTask", "# task 是 GetTask 的返回结果").replace(
  "# raises ValidationError if the reply does not match",
  "# 回复不符合 Schema 时抛出 ValidationError",
);
