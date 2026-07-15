import { RecipeGeneratorView } from "./RecipeGeneratorView";

const RADEONRUN = "https://github.com/radeon-arena/radeonrun";

export function SubmitView({ hw }: { hw?: string }) {
  return (
    <div className="space-y-4">
      <div className="card p-7 text-sm leading-relaxed text-zinc-300">
        <h2 className="text-xl font-semibold text-zinc-100">Submit Recipe</h2>
        <p className="mt-3 text-zinc-400">
          Radeon Arena accepts benchmark updates through GitHub pull requests. The site does not accept
          numbers from a web form: every row should be tied to a reproducible matrix and recorded image identity, and
          a measured result file that can be reviewed in git.
        </p>
        <p className="mt-3 text-zinc-400">
          Open a PR against <span className="font-medium text-zinc-200">radeon-arena/radeonrun</span> with
          model/launch/matrix specs and the measured <code>results/&lt;device&gt;/&lt;matrix&gt;.json</code>. Include the model,
          runtime, quantization, GPU, benchmark profile, requested/resolved image identity, and the measured
          throughput/latency numbers.
        </p>
        <p className="mt-3 text-zinc-400">
          Maintainers review the PR, verify that the numbers are reproducible, and merge the update once
          the result matches the board&apos;s methodology.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`${RADEONRUN}/pulls`} className="btn-primary">Open a pull request</a>
          <a href={RADEONRUN} className="btn-ghost">View radeonrun</a>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Measurement parameters come from the selected benchmark profile; the committed result records every input/output length, depth, concurrency, and repetition.
      </p>

      <div className="card p-7">
        <h3 className="text-lg font-semibold text-zinc-100">Matrix draft helper</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Paste a serve command to generate starter Model, Launch, and Matrix YAML documents. Treat them as a
          draft: verify the OCI image, model source, placeholders, and measured result JSON before submitting.
        </p>
        <div className="mt-5">
          <RecipeGeneratorView hw={hw} />
        </div>
      </div>
    </div>
  );
}
