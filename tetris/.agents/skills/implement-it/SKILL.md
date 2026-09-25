---
name: implement-it
description: Implement the student's current homework iteration yourself, then demo it and pause. Use when the student says "implement it" or wants the iteration built for them with a walkthrough.
---
Implement the current homework iteration, then explain and demo what changed before asking whether to continue.

This is guided autopilot. Do the implementation yourself, but walk the student through the build one iteration at a time. After each iteration, show what was learned, what changed, how to try it, and what's still missing.

Work from `tetris/.factory`. The spec is in `spec/`, the student's progress in `ITERATION`, and the seeds in `../seeds/`. The codebase the factory builds the game in is `..`.

Follow this process exactly:

1. Read `ITERATION`. If it is missing or says `Done`, follow the fetch-iteration skill first. Carry on here once it has committed the adoption.
2. Read the whole spec: `spec/README.md`, `spec/FACTORY.md`, `spec/features/` and the seeds in `../seeds/`.
3. If the spec is unclear, stop and ask before editing.
4. Check the working tree and avoid touching unrelated student changes.
5. Check the current branch.
6. If the current branch is `main`, offer to create and switch to a dated solution branch named `solution/YYYY-MM-DD` before editing. If that branch already exists, suggest `solution/YYYY-MM-DD-2`, then `solution/YYYY-MM-DD-3`, and so on.
7. If the student says yes, create and switch to the branch. If they say no, continue on the current branch.
8. If this is iteration 001 and there is no factory implementation yet, ask what language and shape the student wants it in. For later iterations, keep using what they already chose.
9. Implement only this iteration. Do not start any later iteration.
10. Run whatever checks the factory has (tests, linters). If there are none, walk through the feature files' examples by hand against manual runs of the factory. Use the stand-ins in `stand-ins/` for the examples that call for them.
11. If checks fail and you cannot fix them within the spec, stop and report the failure.
12. Change `ITERATION` from `<iteration> WIP` to `<iteration> Done`.
13. Commit the implementation and that change with message `Implement homework <iteration>`.
14. Report back with:
    - the iteration number and title
    - the goal in plain language, from `spec/README.md` and `spec/FACTORY.md`
    - a short summary of what changed
    - the README's example CLI commands, as something the student can try
    - what's still missing, from the closing lines of `spec/README.md`
15. Ask: "Ready for me to implement the next iteration?"
16. Stop and wait for the student's answer. If they say yes, repeat from step 1. If they say no, stop.

Rules:

- Implement one iteration per commit.
- Offer a solution branch before editing on `main`; do not create a branch without the student confirming.
- Pause after each iteration; do not automatically continue without the student confirming.
- Do not edit anything in `spec/`. `ITERATION` is yours to update.
- Do not commit unrelated existing changes.
- Keep each implementation scoped to its spec.
- Keep the factory minimal: a short loop driving the agent, with state on disk. Do not encode the plan or the seed in code.
- The factory never contains an agent of its own, stand-in or otherwise. Stand-ins are chosen from outside, the same way `pi` is.
- Avoid defensive code and production hardening unless the spec asks for it.
