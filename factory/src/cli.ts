import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

interface Options {
  seed: string;
  target: string;
  agent: string;
  all: boolean;
}

interface AgentResult {
  complete: boolean;
  task?: string;
}

function optionsFrom(argv: string[]): Options {
  let seed = "";
  let target = "";
  let agent = "pi";
  let all = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--all") all = true;
    else if (argument === "--seed") seed = argv[++index] ?? "";
    else if (argument === "--target") target = argv[++index] ?? "";
    else if (argument === "--agent") agent = argv[++index] ?? "";
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!seed || !target || !agent) {
    throw new Error("Usage: factory --seed <file> --target <folder> [--agent <command>] [--all]");
  }

  return {
    seed: resolve(seed),
    target: resolve(target),
    agent,
    all
  };
}

function promptFor(seed: string, plan: string, target: string): string {
  return `Work in the codebase at ${target}.
The seed is ${seed}.
The plan is ${plan}.

If the plan does not exist, read the seed and write the plan as a short list of unchecked tasks. Do not implement a task on that pass.
Otherwise, choose the first unfinished task, implement only that task in the codebase, and mark it done in the plan. If every task is already done, make no changes.

Finish your answer with a result on its own line as JSON. The result must have the boolean field "complete", which is true only when no task remains. When you did a task, also include its name in "task".`;
}

function readResult(output: string): AgentResult | undefined {
  const lines = output.split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const value: unknown = JSON.parse(lines[index]);
      if (
        typeof value === "object" &&
        value !== null &&
        "complete" in value &&
        typeof value.complete === "boolean"
      ) {
        return value as AgentResult;
      }
    } catch {
      // Agent commentary is allowed; only JSON lines are candidate results.
    }
  }
  return undefined;
}

function git(target: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
}

function commitPass(target: string, task?: string): boolean {
  const add = git(target, ["add", "-A", "--", "."]);
  if (add.status !== 0) {
    process.stderr.write(add.stderr ?? "Could not stage the agent's work.\n");
    return false;
  }

  git(target, ["reset", "-q", "--", ".factory"]);
  const changed = git(target, ["diff", "--cached", "--quiet", "--", "."]);
  if (changed.status === 0) return true;

  const commit = git(target, ["commit", "-m", task || "Factory pass"]);
  if (commit.status !== 0) {
    process.stderr.write(commit.stderr ?? "Could not commit the agent's work.\n");
    return false;
  }
  return true;
}

function main(): number {
  let options: Options;
  try {
    options = optionsFrom(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  if (!existsSync(options.seed)) {
    console.error(`There is no seed at ${options.seed}`);
    return 1;
  }

  mkdirSync(join(options.target, ".factory"), { recursive: true });
  const plan = join(options.target, ".factory", "plan.md");
  const prompt = promptFor(options.seed, plan, options.target);

  while (true) {
    const hadPlan = existsSync(plan);
    const agent = spawnSync(options.agent, ["-p", prompt], {
      cwd: options.target,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });

    if (agent.error || agent.status !== 0) {
      console.error(`Could not run the agent${agent.error ? `: ${agent.error.message}` : "."}`);
      return 1;
    }

    const result = readResult(agent.stdout);
    if (!result) {
      console.error("Could not read the agent's result.");
      return 1;
    }

    console.log(JSON.stringify(result));
    if (result.complete) {
      if (options.all) console.log("factory stopped");
      return 0;
    }

    if (hadPlan && !commitPass(options.target, result.task)) return 1;
    if (!options.all) return 0;
  }
}

process.exitCode = main();
