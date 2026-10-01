import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { plannerPrompt, doerPrompt, validatorPrompt } from "./prompts";
import { changedWork, commitWork } from "./work";

type Machine = "planner" | "doer" | "validator";
type Result = Record<string, unknown>;

interface Options {
  seed: string;
  target: string;
  harnesses: Record<Machine, string>;
  lens: string;
  attempts: number;
  all: boolean;
}

function optionsFrom(argv: string[]): Options {
  let seed = "";
  let target = "";
  let agent = "pi";
  let lens: string | undefined;
  let attempts = 3;
  let all = false;
  const overrides: Partial<Record<Machine, string>> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--all") all = true;
    else if (argument === "--seed") seed = argv[++index] ?? "";
    else if (argument === "--target") target = argv[++index] ?? "";
    else if (argument === "--agent") agent = argv[++index] ?? "";
    else if (argument === "--lens") lens = argv[++index] ?? "";
    else if (argument === "--attempts") attempts = Number(argv[++index]);
    else if (["--planner", "--doer", "--validator"].includes(argument)) {
      overrides[argument.slice(2) as Machine] = argv[++index] ?? "";
    } else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!seed || !target || !agent || Object.values(overrides).some((value) => !value)) {
    throw new Error("Usage: factory --seed <file> --target <folder> [--agent <command>] [--planner <command>] [--doer <command>] [--validator <command>] [--lens <text>] [--attempts <number>] [--all]");
  }
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error("--attempts must be a positive integer");

  return {
    seed: resolve(seed),
    target: resolve(target),
    harnesses: { planner: agent, doer: agent, validator: agent, ...overrides },
    lens: lens ?? readFileSync(join(__dirname, "..", "validation-lens.md"), "utf8"),
    attempts,
    all
  };
}

function readResult(output: string): unknown {
  const lines = output.split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Commentary is allowed. Only the last line that parses as JSON is the result.
    }
  }
  return undefined;
}

function callMachine(options: Options, machine: Machine, prompt: string): Result {
  const answer = spawnSync(options.harnesses[machine], ["-p", prompt], {
    cwd: options.target,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  if (answer.error || answer.status !== 0) {
    throw new Error(`Could not run the ${machine}${answer.error ? `: ${answer.error.message}` : "."}`);
  }
  const result = readResult(answer.stdout);
  if (
    typeof result !== "object" || result === null || Array.isArray(result) ||
    (machine === "planner" && !("complete" in result && typeof result.complete === "boolean")) ||
    (machine === "validator" && !("satisfied" in result && typeof result.satisfied === "boolean" &&
      "findings" in result && Array.isArray(result.findings)))
  ) {
    throw new Error(`Could not read the ${machine}'s result.`);
  }
  return result as Result;
}

function runFactory(options: Options): void {
  if (!existsSync(options.seed)) throw new Error(`There is no seed at ${options.seed}`);
  mkdirSync(join(options.target, ".factory"), { recursive: true });
  const plan = join(options.target, ".factory", "plan.md");

  while (true) {
    const hadPlan = existsSync(plan);
    let planner = callMachine(options, "planner", plannerPrompt(options.seed, plan, options.target));
    if (!hadPlan || planner.complete) {
      console.log(JSON.stringify(planner));
      if (planner.complete) break;
      if (!options.all) return;
      continue;
    }

    let findings: unknown[] = [];
    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      const doer = callMachine(options, "doer", doerPrompt(options.seed, plan, options.target, findings));
      const verdict = callMachine(options, "validator", validatorPrompt(
        options.seed, options.target, options.lens, changedWork(options.target)
      ));
      if (verdict.satisfied) {
        commitWork(options.target, typeof doer.task === "string" ? doer.task : "Factory pass");
        planner = callMachine(options, "planner", plannerPrompt(options.seed, plan, options.target, JSON.stringify(doer)));
        console.log(JSON.stringify({ ...planner, task: doer.task }));
        break;
      }
      findings = verdict.findings as unknown[];
      if (attempt === options.attempts) throw new Error(`The pass hit its limit of ${options.attempts} attempts.`);
    }
    if (planner.complete) break;
    if (!options.all) return;
  }
  if (options.all) console.log("factory stopped");
}

try {
  runFactory(optionsFrom(process.argv.slice(2)));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
