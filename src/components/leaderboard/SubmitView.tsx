const ARENA = "https://github.com/radeon-arena/radeon-arena";

export function SubmitView({ hw }: { hw?: string }) {
  void hw;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-7 text-sm leading-relaxed text-zinc-300">
        <h2 className="text-xl font-semibold text-zinc-100">Submit a result</h2>
        <p className="mt-3 text-zinc-400">
          Radeon Arena accepts benchmark updates through GitHub pull requests. The site does not accept
          numbers from a web form: every row should be tied to a reproducible recipe, a pinned image, and
          a measured result file that can be reviewed in git.
        </p>
        <p className="mt-3 text-zinc-400">
          Open a PR against <span className="font-medium text-zinc-200">radeon-arena/radeon-arena</span> with
          the benchmark data you want to add or update. Include the model, runtime, quantization, GPU,
          benchmark profile, image tag/commit, and the measured throughput/latency numbers.
        </p>
        <p className="mt-3 text-zinc-400">
          Maintainers review the PR, verify that the numbers are reproducible, and merge the update once
          the result matches the board&apos;s methodology.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`${ARENA}/pulls`} className="btn-primary">Open a pull request</a>
          <a href={ARENA} className="btn-ghost">View repository</a>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Measurement uses <code>serve-stream-in512-out128</code> at concurrency 1 / 4 / 16 / 32.
      </p>
    </div>
  );
}
