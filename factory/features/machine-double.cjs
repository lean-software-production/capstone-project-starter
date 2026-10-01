#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const config = JSON.parse(fs.readFileSync(process.env.FACTORY_TEST_CONFIG, "utf8"));
const harness = path.basename(process.argv[1]) === "pi" ? "pi" : "chosen";
const prompt = process.argv.slice(2).join(" ");
const machine = prompt.match(/You are the (planner|doer|validator)\./)?.[1];
const priorCalls = fs.existsSync(config.callLog)
  ? fs.readFileSync(config.callLog, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse)
  : [];
const planExists = fs.existsSync(config.planPath);
const plan = planExists ? fs.readFileSync(config.planPath, "utf8") : "";
const commits = Number(execFileSync("git", ["rev-list", "--count", "HEAD"], { cwd: config.codebase, encoding: "utf8" }));
fs.appendFileSync(config.callLog, JSON.stringify({ harness, machine, prompt, commits, plan }) + "\n");
fs.mkdirSync(config.promptsDir, { recursive: true });
fs.writeFileSync(path.join(config.promptsDir, `${priorCalls.length + 1}-${machine}.txt`), prompt);

const prose = config.plannerInProse || config.doerInProse;
const nextTask = prose
  ? (plan.includes("Alpha is done.") ? (plan.includes("Beta is done.") ? undefined : "beta") : "alpha")
  : plan.match(/^- \[ \] (.+)$/m)?.[1];
let result;

if (machine === "planner") {
  if (!planExists) {
    fs.writeFileSync(config.planPath, config.plannerInProse
      ? "Alpha comes first. Beta follows.\n"
      : "# Plan\n\n- [ ] alpha\n- [ ] beta\n");
    result = { complete: false };
  } else if (prompt.includes("The task's work has been committed")) {
    if (prose) {
      fs.appendFileSync(config.planPath, nextTask === "alpha" ? "Alpha is done.\n" : "Beta is done.\n");
      result = { complete: nextTask === "beta" };
    } else {
      const updated = plan.replace(`- [ ] ${nextTask}`, `- [x] ${nextTask}`);
      fs.writeFileSync(config.planPath, updated);
      result = { complete: !updated.match(/^- \[ \] /m) };
    }
  } else {
    result = { complete: !nextTask };
  }
} else if (machine === "doer") {
  const file = config.writeSentinel ? "SENTINEL" : `work-${nextTask}.txt`;
  const findings = JSON.parse(prompt.match(/Validator findings:\n([^\n]+)/)?.[1] ?? "[]");
  if (findings.length) {
    fs.writeFileSync(config.planPath, plan.replace(
      `- [ ] ${nextTask}`,
      `- [ ] ${nextTask}\n  - [x] Give the behavior a focused collaborator`
    ));
  }
  if (!config.doerNoChanges) fs.writeFileSync(path.join(config.codebase, file), `${nextTask}\n${findings.length ? "corrected\n" : ""}`);
  result = { task: nextTask };
} else if (machine === "validator") {
  if (config.validatorInProse) {
    console.log("The work seems fine, but here is no JSON result.");
    process.exit(0);
  }
  const validationCount = priorCalls.filter(c => c.machine === "validator").length;
  const satisfied = config.validation !== "never" && !(config.validation === "reject-first" && validationCount === 0);
  result = {
    satisfied,
    findings: satisfied ? [] : [{ file: `work-${nextTask}.txt`, issue: "Give the behavior a focused collaborator" }]
  };
  if (config.validatorPrefix) console.log(config.validatorPrefix);
} else {
  throw new Error("No machine role in prompt");
}

console.log(JSON.stringify(result));
if (machine === "validator" && config.invalidLastVerdict) console.log('{"note":"not a verdict"}');
