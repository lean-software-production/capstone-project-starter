import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { FactoryWorld } from "./world";

const run = (cwd: string, command: string, args: string[] = []): string => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${command} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
};

const agentDouble = `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const configPath = process.env.FACTORY_TEST_CONFIG;
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const role = path.basename(process.argv[1]) === "pi" ? "pi" : "chosen";
const prompt = process.argv.slice(2).join(" ");
fs.appendFileSync(config.callLog, JSON.stringify({ role, prompt }) + "\\n");

if (config.answerInProse) {
  console.log("I did the work, but supplied no machine-readable result.");
  process.exit(0);
}

let result;
if (!fs.existsSync(config.planPath)) {
  if (config.planInProse) {
    fs.writeFileSync(config.planPath, "Alpha comes first. Beta follows.\\n");
  } else {
    fs.writeFileSync(config.planPath, "# Plan\\n\\n- [ ] alpha\\n- [ ] beta\\n");
  }
  result = { complete: false, task: "write the plan" };
} else if (config.planInProse) {
  const alpha = path.join(config.codebase, "work-alpha.txt");
  const beta = path.join(config.codebase, "work-beta.txt");
  if (!fs.existsSync(alpha)) {
    fs.writeFileSync(alpha, "alpha\\n");
    fs.appendFileSync(config.planPath, "Alpha is done.\\n");
    result = { complete: false, task: "alpha" };
  } else if (!fs.existsSync(beta)) {
    fs.writeFileSync(beta, "beta\\n");
    fs.appendFileSync(config.planPath, "Beta is done.\\n");
    result = { complete: false, task: "beta" };
  } else {
    result = { complete: true };
  }
} else {
  const plan = fs.readFileSync(config.planPath, "utf8");
  const match = plan.match(/- \\[ \\] ([^\\n]+)/);
  if (!match) {
    result = { complete: true };
  } else {
    const task = match[1].trim();
    fs.writeFileSync(
      config.planPath,
      plan.replace("- [ ] " + match[1], "- [x] " + match[1])
    );
    const output = config.writeSentinel ? "SENTINEL" : "work-" + task + ".txt";
    fs.writeFileSync(path.join(config.codebase, output), task + "\\n");
    result = { complete: false, task };
  }
}

if (config.prefix) console.log(config.prefix);
console.log(JSON.stringify(result));
`;

function saveAgentConfig(world: FactoryWorld): void {
  writeFileSync(
    world.configPath,
    JSON.stringify({
      ...world.agentConfig,
      callLog: world.callLog,
      codebase: world.codebase,
      planPath: world.planPath
    })
  );
}

function writePlan(world: FactoryWorld, completed: number): void {
  const tasks = ["alpha", "beta", "gamma"];
  const lines = tasks.map((task, index) => `- [${index < completed ? "x" : " "}] ${task}`);
  writeFileSync(world.planPath, `# Plan\n\n${lines.join("\n")}\n`);
}

function calls(world: FactoryWorld): Array<{ role: string; prompt: string }> {
  if (!existsSync(world.callLog)) return [];
  return readFileSync(world.callLog, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function commitCount(world: FactoryWorld): number {
  return Number(run(world.codebase, "git", ["rev-list", "--count", "HEAD"]));
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
  mkdirSync(this.fakeBin, { recursive: true });
  copyFileSync(resolve("factory"), join(this.factoryDir, "factory"));
  chmodSync(join(this.factoryDir, "factory"), 0o755);
  cpSync(resolve("src"), join(this.factoryDir, "src"), { recursive: true });
  symlinkSync(resolve("node_modules"), join(this.factoryDir, "node_modules"));

  writeFileSync(this.chosenAgent, agentDouble);
  chmodSync(this.chosenAgent, 0o755);
  writeFileSync(join(this.fakeBin, "pi"), agentDouble);
  chmodSync(join(this.fakeBin, "pi"), 0o755);

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

Given("the agent plans the tasks alpha and beta, and does one task a pass", function (this: FactoryWorld) {
  saveAgentConfig(this);
});

Given("no harness is chosen", function (this: FactoryWorld) {
  this.useChosenAgent = false;
});

Given("the agent cannot be run", function (this: FactoryWorld) {
  this.chosenAgent = join(this.workspace, "missing-agent");
});

Given("no plan", function (this: FactoryWorld) {
  rmSync(this.planPath, { force: true });
});

Given("a plan with three tasks, none of them done", function (this: FactoryWorld) {
  writePlan(this, 0);
});

Given("the agent writes a file called SENTINEL", function (this: FactoryWorld) {
  this.agentConfig.writeSentinel = true;
  saveAgentConfig(this);
});

Given("a plan in which every task is done", function (this: FactoryWorld) {
  writePlan(this, 3);
});

Given("the agent says {string} before its result", function (this: FactoryWorld, message: string) {
  this.agentConfig.prefix = message;
  saveAgentConfig(this);
});

Given("a plan whose first task is done", function (this: FactoryWorld) {
  writePlan(this, 1);
});

Given("the agent answers in prose, with no result", function (this: FactoryWorld) {
  this.agentConfig.answerInProse = true;
  saveAgentConfig(this);
});

Given("the codebase has no seed", function (this: FactoryWorld) {
  rmSync(this.seedPath, { force: true });
});

Given("the agent keeps its plan in prose", function (this: FactoryWorld) {
  this.agentConfig.planInProse = true;
  saveAgentConfig(this);
});

function runFactory(world: FactoryWorld, all: boolean): void {
  saveAgentConfig(world);
  const args = ["--seed", world.seedPath, "--target", world.codebase];
  if (world.useChosenAgent) args.push("--agent", world.chosenAgent);
  if (all) args.push("--all");
  const result = spawnSync(join(world.factoryDir, "factory"), args, {
    cwd: world.codebase,
    encoding: "utf8",
    env: {
      ...process.env,
      FACTORY_TEST_CONFIG: world.configPath,
      PATH: `${world.fakeBin}${delimiter}${process.env.PATH ?? ""}`
    },
    timeout: 10_000
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
  assert.ok(calls(this).some((call) => call.role === "pi"));
});

Then("the chosen agent has been called", function (this: FactoryWorld) {
  assert.ok(calls(this).some((call) => call.role === "chosen"));
});

Then("pi has not been called", function (this: FactoryWorld) {
  assert.ok(calls(this).every((call) => call.role !== "pi"));
});

Then("it reports that it could not run the agent", function (this: FactoryWorld) {
  assert.match(this.output, /could not run the agent/i);
});

Then("there is no plan", function (this: FactoryWorld) {
  assert.equal(existsSync(this.planPath), false);
});

Then("there are no new commits", function (this: FactoryWorld) {
  assert.equal(commitCount(this), this.initialCommitCount);
});

Then("the plan has the tasks {string} and {string}, and no others", function (this: FactoryWorld, first: string, second: string) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.deepEqual([...plan.matchAll(/- \[[ x]\] (.+)/g)].map((match) => match[1]), [first, second]);
});

Then("there is one new commit", function (this: FactoryWorld) {
  const status = run(this.codebase, "git", ["status", "--short"]);
  assert.equal(commitCount(this), this.initialCommitCount + 1, `${this.output}\ngit status:\n${status}`);
});

Then("it contains SENTINEL and nothing else", function (this: FactoryWorld) {
  const files = run(this.codebase, "git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"])
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(files, ["SENTINEL"]);
});

Then("the agent was pointed at the plan and at the seed", function (this: FactoryWorld) {
  const prompt = calls(this).at(-1)?.prompt ?? "";
  assert.ok(prompt.includes(this.planPath), "prompt did not include the plan path");
  assert.ok(prompt.includes(this.seedPath), "prompt did not include the seed path");
});

Then("the agent was asked for a result with the field {string}", function (this: FactoryWorld, field: string) {
  assert.match(calls(this).at(-1)?.prompt ?? "", new RegExp(`result[\\s\\S]*${field}`, "i"));
});

Then("the agent has been called once", function (this: FactoryWorld) {
  assert.equal(calls(this).length, 1);
});

Then("the factory has stopped", function (this: FactoryWorld) {
  assert.notEqual(this.exitCode, null);
});

Then("the plan shows the first task as done", function (this: FactoryWorld) {
  assert.match(readFileSync(this.planPath, "utf8"), /- \[x\] alpha/);
});

Then("the plan shows the other two as not done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.match(plan, /- \[ \] beta/);
  assert.match(plan, /- \[ \] gamma/);
});

Then("it contains the work for the first task", function (this: FactoryWorld) {
  assert.equal(readFileSync(join(this.codebase, "work-alpha.txt"), "utf8"), "alpha\n");
});

Then("it contains the work for the second task", function (this: FactoryWorld) {
  assert.equal(readFileSync(join(this.codebase, "work-beta.txt"), "utf8"), "beta\n");
});

Then("the plan shows every task as done", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.equal(/- \[ \]/.test(plan), false);
  assert.equal((plan.match(/- \[x\]/g) ?? []).length, 3);
});

Then("there are three new commits", function (this: FactoryWorld) {
  assert.equal(commitCount(this), this.initialCommitCount + 3);
});

Then("it reports that it could not read the agent's result", function (this: FactoryWorld) {
  assert.match(this.output, /could not read the agent's result/i);
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
  assert.equal((plan.match(/- \[ \]/g) ?? []).length, 2);
  assert.equal(/- \[x\]/.test(plan), false);
});

Then("the plan still has those three tasks", function (this: FactoryWorld) {
  const plan = readFileSync(this.planPath, "utf8");
  assert.deepEqual([...plan.matchAll(/- \[[ x]\] (.+)/g)].map((match) => match[1]), ["alpha", "beta", "gamma"]);
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
  assert.equal(existsSync(join(this.codebase, "work-alpha.txt")), true);
  assert.equal(existsSync(join(this.codebase, "work-beta.txt")), true);
  assert.equal(commitCount(this), this.initialCommitCount + 2);
});
