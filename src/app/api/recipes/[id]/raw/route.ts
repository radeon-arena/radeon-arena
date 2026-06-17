import yaml from "js-yaml";
import { getAllBenchmarks, getBenchmark } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

// GET /api/recipes/[id]/raw — download the recipe YAML by permalink id.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  let benchmark = await getBenchmark(id);
  if (!benchmark) {
    const all = await getAllBenchmarks();
    benchmark =
      all.find((b) => b.recipePermalinkId === id) ??
      all.find((b) => b.benchmarkId === id) ??
      null;
  }
  if (!benchmark?.recipe) {
    return new Response("recipe not found\n", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  const body = yaml.dump(benchmark.recipe.fullRecipe ?? benchmark.recipe, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename="recipe.yaml"`,
    },
  });
}
