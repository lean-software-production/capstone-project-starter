---
name: implement-fast
description: Implement the student's current homework iteration yourself, without a walkthrough. Use when the student wants the iteration built quickly.
---
Implement the current homework iteration.

Work from `tetris/.factory`. The spec is in `spec/`, the student's progress in `ITERATION`, and the seeds in `../seeds/`. The target, where the factory builds the game, is `..`.

Follow this process exactly:

1. Read `ITERATION`. If it is missing or says `Done`, follow the fetch-iteration skill first. Carry on here once it has committed the adoption.
2. Read the whole spec: `spec/README.md`, `spec/FACTORY.md`, `spec/features/` and the seeds in `../seeds/`.
3. If the spec is unclear, stop and ask before editing.
4. Check the working tree and avoid touching unrelated student changes.
5. If this is iteration 001 and there is no factory implementation yet, ask what language and shape the student wants it in. For later iterations, keep using what they already chose.
6. Implement only this iteration. Do not start any later iteration.
7. Run whatever checks the factory has (tests, linters). If there are none, walk through the feature files' examples by hand, using the stand-ins in `stand-ins/` where they call for them.
8. Change `ITERATION` from `<iteration> WIP` to `<iteration> Done`.
9. Commit the implementation and that change with message `Implement homework <iteration>`.

Rules:

- Do not start more than one iteration.
- Do not edit anything in `spec/`. `ITERATION` is yours to update.
- Do not commit unrelated existing changes.
- Keep the implementation scoped to the spec.
- Keep the factory minimal. It never contains an agent of its own, stand-in or otherwise.
- If checks fail and you cannot fix them within the spec, stop and report the failure.
