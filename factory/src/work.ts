import { spawnSync } from "node:child_process";
import { join } from "node:path";

const projectPaths = [".", ":(exclude).factory"];

function git(target: string, args: string[], allowedStatuses = [0]): string {
  const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  if (result.error || !allowedStatuses.includes(result.status ?? -1)) {
    throw new Error(result.error?.message || result.stderr.trim() || "Git command failed");
  }
  return result.stdout;
}

function untrackedFiles(target: string): string[] {
  return git(target, ["ls-files", "--others", "--exclude-standard", "-z", "--", ...projectPaths])
    .split("\0").filter(Boolean);
}

export function changedWork(target: string): string {
  const tracked = git(target, ["diff", "--no-ext-diff", "--relative", "HEAD", "--", ...projectPaths]);
  const untracked = untrackedFiles(target).map((file) =>
    git(target, ["diff", "--no-ext-diff", "--no-index", "--", "/dev/null", join(target, file)], [0, 1])
  );
  return [tracked, ...untracked].join("\n");
}

export function commitWork(target: string, task: string): void {
  const tracked = git(target, ["diff", "--relative", "HEAD", "--name-only", "-z", "--", ...projectPaths])
    .split("\0").filter(Boolean);
  const files = [...new Set([...tracked, ...untrackedFiles(target)])];
  if (!files.length) throw new Error("Validated task produced no committable work; the plan has not advanced.");
  git(target, ["add", "-A", "--", ...files]);
  // Commit only this target's work, leaving the plan and unrelated staged changes alone.
  git(target, ["commit", "--only", "-m", task, "--", ...files]);
}
