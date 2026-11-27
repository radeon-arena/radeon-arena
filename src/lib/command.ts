// Recipe commands in the bundle can still be in template form: multi-line
// commands flattened to one line with " \ " left in, and {host}/{port}/{ctx}/{nseq}
// placeholders. Turn them into a command that runs when pasted into a shell.
export function resolveCommand(command: string, defaults: Record<string, unknown> = {}): string {
  return command
    .replace(/\\\s+/g, " ")
    .replace(/\{(host|port|ctx|nseq)\}/g, (m, key: string) => (defaults[key] === undefined ? m : String(defaults[key])))
    .replace(/ {2,}/g, " ")
    .trim();
}
