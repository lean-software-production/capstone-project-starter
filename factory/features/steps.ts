import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync,
  readdirSync, renameSync, rmSync, symlinkSync, writeFileSync
} from "node:fs";
import { delimiter, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { FactoryWorld } from "./world";

const run = (cwd: string, command: string, args: string[] = []): string => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${command} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
};

interface MachineCall {
  harness: string;
  machine: string;
  prompt: string;
  commits: number;
  plan: string;
}

function calls(world: FactoryWorld, machine?: string): MachineCall[] {
  if (!existsSync(world.callLog)) return [];
  const entries = readFileSync(world.callLog, "utf8").trim().split("\n")
    .filter(Boolean).map((line) => JSON.parse(line) as MachineCall);
  return machine ? entries.filter((call) => call.machine === machine) : entries;
}

function saveAgentConfig(world: FactoryWorld): void {
  writeFileSync(world.configPath, JSON.stringify({
    ...world.agentConfig,
    callLog: world.callLog,
    codebase: world.codebase,
    planPath: world.planPath,
    promptsDir: join(world.workspace, "prompts")
  }));
}

function writePlan(world: FactoryWorld, completed: number): void {
  const lines = ["alpha", "beta", "gamma"].map((task, index) => `- [${index < completed ? "x" : " "}] ${task}`);
  writeFileSync(world.planPath, `# Plan\n\n${lines.join("\n")}\n`);
}

function commitCount(world: FactoryWorld): number {
  return Number(run(world.codebase, "git", ["rev-list", "--count", "HEAD"]));
}

function committedFiles(world: FactoryWorld): string[] {
  return run(world.codebase, "git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"])
    .split("\n").filter(Boolean);
}

Given("a copy of the factory, in a folder of its own inside a new codebase", function (this: FactoryWorld) {
  this.makeWorkspace();
  this.codebase = join(this.workspace, "codebase");
  this.factoryDir = join(this.codebase, ".factory");
  this.seedPath = join(this.codebase, "seeds", "tetris.md");
  this.planPath = join(this.factoryDir, "plan.md");
  this.callLog = join(this.workspace, "agent-calls.jsonl");
  this.configPath = join(this.workspace, "agent-config.json");
  this.fakeBin = join(this.workspace, "fake-bin");
  this.chosenAgent = join(this.workspace, "chosen-agent");

  mkdirSync(join(this.factoryDir, "src"), { recursive: true });
  mkdirSync(join(this.codebase, "bin"), { recursive: true });
  mkdirSync(this.fakeBin, { recursive: true });
  copyFileSync(resolve("factory"), join(this.factoryDir, "factory"));
  chmodSync(join(this.factoryDir, "factory"), 0o755);
  cpSync(resolve("src"), join(this.factoryDir, "src"), { recursive: true });
  copyFileSync(resolve("tsconfig.json"), join(this.factoryDir, "tsconfig.json"));
  copyFileSync(resolve("validation-lens.md"), join(this.factoryDir, "validation-lens.md"));
  symlinkSync(resolve("node_modules"), join(this.factoryDir, "node_modules"));
  symlinkSync("../.factory/factory", join(this.codebase, "bin", "factory"));

  for (const path of [this.chosenAgent, join(this.fakeBin, "pi")]) {
    copyFileSync(resolve("features/machine-double.cjs"), path);
    chmodSync(path, 0o755);
  }

  writeFileSync(join(this.codebase, ".gitignore"), ".factory/\n");
  run(this.codebase, "git", ["init", "-q"]);
  run(this.codebase, "git", ["config", "user.name", "Factory test"]);
  run(this.codebase, "git", ["config", "user.email", "factory@example.test"]);
});

Given("a seed describing a game of Tetris", function (this: FactoryWorld) {
  mkdirSync(join(this.codebase, "seeds"), { recursive: true });
  writeFileSync(this.seedPath, "Build a terminal game of Tetris.\n");
  run(this.codebase, "git", ["add", "."]);
  run(this.codebase, "git", ["commit", "-qm", "Initial codebase"]);
  this.initialCommitCount = commitCount(this);
});

Given("the planner plans the tasks alpha and beta", function (this: FactoryWorld) {
  saveAgentConfig(this);
});

Given("the doer does the next task in the plan", function (this: FactoryWorld) {
  saveAgentConfig(this);
});

Given("the validator is always satisfied", function (this: FactoryWorld) {
  this.agentConfig.validation = "always";
  saveAgentConfig(this);
});

Given("no harness is chosen", function (this: FactoryWorld) {
  this.useChosenAgent = false;
});

Given("the doer cannot be run", function (this: FactoryWorld) {
  this.missingDoer = true;
});

Given("no plan", function (this: FactoryWorld) {
  rmSync(this.planPath, { force: true });
});

Given("a plan with three tasks, none of them done", function (this: FactoryWorld) {
  writePlan(this, 0);
});

Given("the doer writes a file called SENTINEL", function (this: FactoryWorld) {
  this.agentConfig.writeSentinel = true;
});

Given("a plan in which every task is done", function (this: FactoryWorld) {
  writePlan(this, 3);
});

Given("the validator says {string} before its result", function (this: FactoryWorld, message: string) {
  this.agentConfig.validatorPrefix = message;
});

Given("a plan whose first task is done", function (this: FactoryWorld) {
  writePlan(this, 1);
  writeFileSync(join(this.codebase, "work-alpha.txt"), "alpha\n");
  run(this.codebase, "git", ["add", "work-alpha.txt"]);
  run(this.codebase, "git", ["commit", "-qm", "Earlier work"]);
  this.initialCommitCount = commitCount(this);
});

Given("the validator answers in prose, with no result", function (this: FactoryWorld) {
  this.agentConfig.validatorInProse = true;
});

Given("the codebase has no seed", function (this: FactoryWorld) {
  rmSync(this.seedPath, { force: true });
});

Given("the planner keeps its plan in prose", function (this: FactoryWorld) {
  this.agentConfig.plannerInProse = true;
});

Given("the doer keeps its plan in prose", function (this: FactoryWorld) {
  this.agentConfig.doerInProse = true;
});

Given("the factory allows at most three attempts per pass", function (this: FactoryWorld) {
  this.attempts = 3;
});

Given("the validator is never satisfied", function (this: FactoryWorld) {
  this.agentConfig.validation = "never";
});

Given("the validator is not satisfied the first time", function (this: FactoryWorld) {
  this.agentConfig.validation = "reject-first";
});

Given("the validator's lens is testability", function (this: FactoryWorld) {
  this.lens = "testability";
});

function runFactory(world: FactoryWorld, all: boolean): void {
  saveAgentConfig(world);
  const args = ["--seed", relative(world.codebase, world.seedPath), "--target", ".", "--attempts", String(world.attempts)];
  if (world.useChosenAgent) args.push("--agent", world.chosenAgent);
  if (world.missingDoer) args.push("--doer", join(world.workspace, "missing-doer"));
  if (world.lens) args.push("--lens", world.lens);
  if (all) args.push("--all");
  const result = spawnSync(join("bin", "factory"), args, {
    cwd: world.codebase,
    encoding: "utf8",
    env: {
      ...process.env,
      FACTORY_TEST_CONFIG: world.configPath,
      PATH: `${world.fakeBin}${delimiter}${process.env.PATH ?? ""}`
    },
    timeout: 12_000
  });
  world.exitCode = result.status;
  world.output = `${result.stdout}${result.stderr}`;
}

When("the factory runs one pass", function (this: FactoryWorld) {
  runFactory(this, false);
});

When("the factory runs to completion", function (this: FactoryWorld) {
  runFactory(this, true);
});

Then("pi has been called", function (this: FactoryWorld) {
  assert.ok(calls(this).some((call) => call.harness === "pi"), this.output);
});

Then("the doer's chosen harness has been called", function (this: FactoryWorld) {
  assert.ok(calls(this, "doer").some((call) => call.harness === "chosen"), this.output);
});

Then("pi has not been called", function (this: FactoryWorld) {
  assert.ok(calls(this).every((call) => call.harness !== "pi"));
});

Then("it reports that it could not run the doer", function (this: FactoryWorld) {
  assert.match(this.output, /could not run the doer/i);
  assert.equal(this.exitCode, 1);
});

Then("there is no plan", function (this: FactoryWorld) {
  assert.equal(existsSync(this.planPath), false);
});

Then("there are no new commits", function (this: FactoryWorld) {
  assert.equal(commitCount(this), this.initialCommitCount, this.output);
});

Then("the plan has the tasks {string} and {string}, and no others", function (this: FactoryWorld, first: string, second: string) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.deepEqual([...plan.matchAll(/^- \[[ x]\] (.+)$/gm)].map((match) => match[1]), [first, second]);
});

Then("there is one new commit", function (this: FactoryWorld) {
  assert.equal(commitCount(this), this.initialCommitCount + 1, this.output);
});

Then("it contains SENTINEL and nothing else", function (this: FactoryWorld) {
  assert.deepEqual(committedFiles(this), ["SENTINEL"]);
});

Then("the doer was pointed at the plan and at the seed", function (this: FactoryWorld) {
  const prompt = calls(this, "doer").at(-1)?.prompt ?? "";
  assert.ok(prompt.includes(this.planPath), "prompt did not include the plan path");
  assert.ok(prompt.includes(this.seedPath), "prompt did not include the seed path");
});

Then("the planner was asked for a result with the field {string}", function (this: FactoryWorld, field: string) {
  for (const call of calls(this, "planner")) {
    assert.match(call.prompt, new RegExp(`result[\\s\\S]*${field}`, "i"));
  }
  assert.ok(calls(this, "planner").length);
});

Then("the validator was asked for a result with the fields {string} and {string}", function (this: FactoryWorld, first: string, second: string) {
  const prompt = calls(this, "validator").at(-1)?.prompt ?? "";
  assert.match(prompt, new RegExp(`result[\\s\\S]*${first}`, "i"));
  assert.match(prompt, new RegExp(`result[\\s\\S]*${second}`, "i"));
});

Then("the doer has been called once", function (this: FactoryWorld) {
  assert.equal(calls(this, "doer").length, 1, this.output);
});

Then("the doer has been called twice", function (this: FactoryWorld) {
  assert.equal(calls(this, "doer").length, 2, this.output);
});

Then("the doer has been called three times", function (this: FactoryWorld) {
  assert.equal(calls(this, "doer").length, 3, this.output);
});

Then("the doer has not been called", function (this: FactoryWorld) {
  assert.equal(calls(this, "doer").length, 0, this.output);
});

Then("the factory has stopped", function (this: FactoryWorld) {
  assert.notEqual(this.exitCode, null);
});

Then("it reports that the pass hit its limit", function (this: FactoryWorld) {
  assert.match(this.output, /pass hit its limit/i);
  assert.equal(this.exitCode, 1);
  assert.ok(existsSync(join(this.codebase, "work-alpha.txt")), "gave-up work must be left on disk");
});

Then("the plan shows the first task as done", function (this: FactoryWorld) {
  assert.match(readFileSync(this.planPath, "utf8"), /- \[x\] alpha/);
  const record = calls(this, "planner").find((call) => call.prompt.includes("The task's work has been committed"));
  assert.ok(record, "planner was not asked to record the committed work");
  assert.equal(record.commits, this.initialCommitCount + 1, "task must be committed before planner marks it done");
  assert.match(record.plan, /- \[ \] alpha/, "doer must not mark the parent task done");
});

Then("the plan shows the other two as not done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.match(plan, /- \[ \] beta/);
  assert.match(plan, /- \[ \] gamma/);
});

Then("it contains the work for the first task", function (this: FactoryWorld) {
  assert.ok(committedFiles(this).includes("work-alpha.txt"));
  assert.equal(run(this.codebase, "git", ["show", "HEAD:work-alpha.txt"]), "alpha");
});

Then("it contains the work for the second task", function (this: FactoryWorld) {
  assert.ok(committedFiles(this).includes("work-beta.txt"));
  assert.equal(run(this.codebase, "git", ["show", "HEAD:work-beta.txt"]), "beta");
});

Then("the plan shows every task as done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.equal(/^- \[ \]/m.test(plan), false);
  assert.equal((plan.match(/^- \[x\]/gm) ?? []).length, 3);
});

Then("there are three new commits", function (this: FactoryWorld) {
  assert.equal(commitCount(this), this.initialCommitCount + 3, this.output);
});

Then("it reports that it could not read the validator's result", function (this: FactoryWorld) {
  assert.match(this.output, /could not read the validator's result/i);
  assert.equal(this.exitCode, 1);
});

Then("it reports that there is no seed", function (this: FactoryWorld) {
  assert.match(this.output, /no seed/i);
});

Then("no agent has been called", function (this: FactoryWorld) {
  assert.equal(calls(this).length, 0);
});

Then("there is a plan", function (this: FactoryWorld) {
  assert.equal(existsSync(this.planPath), true);
});

Then("the plan shows every task as not done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.ok((plan.match(/^- \[ \]/gm) ?? []).length > 0);
  assert.equal(/^- \[x\]/m.test(plan), false);
});

Then("the plan still has those three tasks", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.deepEqual([...plan.matchAll(/^- \[[ x]\] (.+)$/gm)].map((match) => match[1]), ["alpha", "beta", "gamma"]);
});

Then("the plan is plan.md in the factory's folder", function (this: FactoryWorld) {
  assert.equal(existsSync(join(this.factoryDir, "plan.md")), true);
});

Then("there is no plan anywhere else in the codebase", function (this: FactoryWorld) {
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (path === this.planPath || entry.name === ".git" || entry.name === "node_modules") continue;
      if (entry.isDirectory()) visit(path);
      else if (entry.name === "plan.md") found.push(path);
    }
  };
  visit(this.codebase);
  assert.deepEqual(found, []);
});

Then("the plan shows the first two tasks as done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.match(plan, /- \[x\] alpha/);
  assert.match(plan, /- \[x\] beta/);
  assert.match(plan, /- \[ \] gamma/);
});

Then("the work for alpha and beta has been committed", function (this: FactoryWorld) {
  assert.equal(run(this.codebase, "git", ["show", "HEAD:work-alpha.txt"]), "alpha");
  assert.equal(run(this.codebase, "git", ["show", "HEAD:work-beta.txt"]), "beta");
  assert.equal(commitCount(this), this.initialCommitCount + 2, this.output);
});

Then("the validator was given the work for the second task", function (this: FactoryWorld) {
  const prompt = calls(this, "validator").at(-1)?.prompt ?? "";
  assert.match(prompt, /work-beta\.txt/);
  assert.match(prompt, /\+beta/);
});

Then("it was not given the work for the first task", function (this: FactoryWorld) {
  assert.doesNotMatch(calls(this, "validator").at(-1)?.prompt ?? "", /work-alpha\.txt|\+alpha/);
});

Then("the validator was given {string}", function (this: FactoryWorld, lens: string) {
  assert.ok(calls(this, "validator").at(-1)?.prompt.includes(lens));
});

Then("the doer was given the validator's findings", function (this: FactoryWorld) {
  const prompt = calls(this, "doer")[1]?.prompt ?? "";
  assert.match(prompt, /Give the behavior a focused collaborator/);
  assert.match(prompt, /subtask/i);
  assert.match(readFileSync(this.planPath, "utf8"), /  - \[x\] Give the behavior a focused collaborator/);
});

Given("Git rejects the commit", function (this: FactoryWorld) {
  const hook = join(this.codebase, ".git", "hooks", "pre-commit");
  writeFileSync(hook, '#!/bin/sh\necho "simulated commit failure" >&2\nexit 1\n');
  chmodSync(hook, 0o755);
});

Then("it reports the Git commit failure", function (this: FactoryWorld) {
  assert.match(this.output, /simulated commit failure/);
  assert.equal(this.exitCode, 1);
});

Then("the planner has not been asked to record committed work", function (this: FactoryWorld) {
  assert.ok(calls(this, "planner").every((call) => !call.prompt.includes("The task's work has been committed")));
});

Given("a separate target with an unrelated staged change beside it", function (this: FactoryWorld) {
  const root = this.codebase;
  this.codebase = join(root, "target");
  mkdirSync(this.codebase);
  renameSync(this.factoryDir, join(this.codebase, ".factory"));
  renameSync(join(root, "bin"), join(this.codebase, "bin"));
  this.factoryDir = join(this.codebase, ".factory");
  this.planPath = join(this.factoryDir, "plan.md");
  run(root, "git", ["add", "-A", "--", "bin", "target/bin"]);
  run(root, "git", ["commit", "-qm", "Move factory launcher into the selected target"]);
  this.initialCommitCount = commitCount(this);
  writeFileSync(join(root, "unrelated.txt"), "student's unrelated change\n");
  run(root, "git", ["add", "unrelated.txt"]);
});

Then("the unrelated change remains staged and uncommitted", function (this: FactoryWorld) {
  const root = resolve(this.codebase, "..");
  assert.equal(run(root, "git", ["diff", "--cached", "--name-only"]), "unrelated.txt");
  assert.deepEqual(run(root, "git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]).split("\n"), ["target/work-alpha.txt"]);
});

Given("the validator follows its verdict with JSON that has no verdict fields", function (this: FactoryWorld) {
  this.agentConfig.invalidLastVerdict = true;
});

Given("the next task edits an existing tracked file", function (this: FactoryWorld) {
  writeFileSync(join(this.codebase, "work-alpha.txt"), "before the task\n");
  run(this.codebase, "git", ["add", "work-alpha.txt"]);
  run(this.codebase, "git", ["commit", "--only", "-qm", "Existing task file", "--", "work-alpha.txt"]);
  this.initialCommitCount = commitCount(this);
});

Then("the tracked task file's change is committed", function (this: FactoryWorld) {
  const root = resolve(this.codebase, "..");
  assert.equal(run(root, "git", ["show", "HEAD:target/work-alpha.txt"]), "alpha");
});

Given("the doer produces no file changes", function (this: FactoryWorld) {
  this.agentConfig.doerNoChanges = true;
});

Then("it reports that there is no committable work", function (this: FactoryWorld) {
  assert.match(this.output, /no committable work/i);
  assert.equal(this.exitCode, 1);
});
