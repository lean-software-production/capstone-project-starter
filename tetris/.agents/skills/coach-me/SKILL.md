---
name: coach-me
description: Walk the student through their next homework iteration. Use when the student says "coach me", asks to be coached, or wants to work through their next homework with guidance.
---
Walk the student through implementing their next homework iteration.

The student is building a "factory" — a small program that turns a seed into a plan, then works the plan one task at a time, driving a coding agent to do the real work. The seed and plan live in files on disk, not in the factory's code.

## Where things live

You work from `tetris/.factory`. All paths below are relative to it.

- **The factory** — the student's code, in this folder.
- `spec/` — the iteration they're working on, fetched from the course: `README.md`, `FACTORY.md` and `features/`.
- `ITERATION` — their progress: one line, the iteration and its status, e.g. `001 WIP`.
- `../seeds/` — the seeds the factory builds from.
- `stand-ins/` — stand-in agents for quick, repeatable checks.
- **The target** — `..`, the `tetris/` folder. The factory builds the game there. You don't.

## Coaching

Follow this process exactly:

1. Read `ITERATION`. If it is missing or says `Done`, follow the fetch-iteration skill first. Carry on here once it has committed the adoption.
2. Read the whole spec:
   - `spec/README.md` — the homework framing and its ground rules
   - `spec/FACTORY.md` — a short summary of the factory at this point
   - `spec/features/` — the acceptance criteria, in Gherkin
   - the seeds in `../seeds/`

   Together they are the whole spec, not just what's new.
3. If the spec is unclear, stop and ask before editing.
4. Check the working tree and avoid touching unrelated student changes.
5. If this is iteration 001 and there is no factory implementation yet, ask the student what language and shape they want to build it in (a script, a long-running process, whatever). There is no prescribed stack. For later iterations, keep using what they already chose.
6. Introduce the iteration with a very concise overview:
   - Goal: the behaviour to add, in plain language (from the README and `FACTORY.md`, not the Gherkin).
   - Steps: the small changes needed to get there.
   - Show the README's example CLI commands and expected outputs, then ask the student what questions they have.
   - Mention that if they'd rather you build the whole iteration, they can use `implement-it` (you build it, then demo it) or `implement-fast` (you just build it).
7. Show the first small implementation change.
   - Start with what the step will achieve, then explain how to do it.
   - Reference the current code by file and line number, and quote the relevant nearby code, e.g. "In `path/to/file.ts` around line 37, you should see this...".
   - Be specific about the intent and why we're making the change, and show the new code.
8. Ask whether the student wants to make the change or wants you to make it.
9. If the student chooses to make it, stop and wait for them to say they made the change.
10. If the student asks you to make it, edit only the files needed for that step.
11. Inspect the relevant files or diff to confirm whether the change is correct.
12. If the change is not correct, explain the smallest correction and ask again whether the student wants to make it or wants you to make it.
13. Repeat steps 7-12 until the behaviour in `spec/features/` is true of the student's factory.
14. Run whatever checks the student's implementation has (tests, linters). If there are none yet, walk through the feature files' examples by hand against manual runs of the factory.
    - Use the stand-in agents in `stand-ins/` for the examples that call for them, and for quick checks.
    - Examples that build real software need a real agent.
15. If checks fail because implementation changes are needed, coach the student through the fixes one small change at a time, always offering to make each change yourself.
16. Finish by pointing at what's still missing. Read the closing lines of `spec/README.md` for what the next homework builds on, and make clear that any remaining rough edges are expected at this point.
17. Change `ITERATION` from `<iteration> WIP` to `<iteration> Done`.
18. Commit the implementation and that change with message `Implement homework <iteration>` (e.g. `Implement homework 003`).

## Rules

- Do not start more than one iteration.
- Do not edit anything in `spec/`. It is the spec, not yours to change. `ITERATION` is yours to update.
- Do not edit implementation files unless the student asks you to, and even then only implement the next baby step. If they want you to take over the whole iteration, point them at `implement-it` or `implement-fast`.
- Break the implementation into small baby steps. Prefer outside-in: start with the smallest visible behaviour that proves the new capability, even if parts are hard-coded, then replace the hard-coded pieces one at a time.
- Keep the factory minimal: a short loop driving the agent, with state on disk.
  - The intelligence lives in the agent and the files, not the factory.
  - Do not encode the plan or the seed in code.
  - Do not build a framework.
  - Do not add defensive code or hardening. This is a learning exercise.
- The factory never contains an agent of its own, stand-in or otherwise. Stand-ins are chosen from outside, the same way `pi` is.
- You may run commands to inspect files, review diffs, and run checks.
- Do not commit unrelated existing changes.
- Keep coaching steps small enough for a student to do comfortably.
- Be super concise. Avoid jargon.
- When introducing an iteration, include only the goal and the steps to get there.
- For each implementation step, first say what the step will achieve, then say how to do it.
- When describing a code change, always refer to the current code by file and line number and quote the relevant nearby code.
- At each implementation step, ask whether the student wants to make the change or wants you to make it.
- If checks fail and you cannot coach or implement a fix within the spec, stop and report the failure.
