# Factory — iteration 002

Run from the repository root, into a target within this Git repository:

```sh
# One pass: create a plan, or do and validate one task.
bin/factory --seed tetris/spec.md --target tetris/tetris-002

# Keep going until the planner reports completion.
bin/factory --seed tetris/spec.md --target tetris/tetris-002 --all
```

The planner writes `<target>/.factory/plan.md`. A doer implements the next task;
a validator reviews the changed work. Rejected findings go back to the doer as
subtasks. After validation succeeds, the factory commits only the target's project
work, then asks the planner to mark the task done. The plan is not included in
those commits.

The default lens is [responsibility-driven object design](validation-lens.md),
inspired by Metz, Wirfs-Brock, West, Beck, Cunningham, and Smalltalk.
Override it for a run with `--lens 'testability'`, for example.

All three machines use `pi` by default. `--agent <command>` selects another
harness for all three; `--planner`, `--doer`, and `--validator` override individual
machines. Each command is invoked with `-p <prompt>` in the target directory and
must finish with a single-line JSON result.

`--attempts 3` is the default limit per task. Exhausting it leaves the rejected
work on disk, uncommitted, with the parent task still unfinished. Invalid results,
failed machines, failed commits, and tasks with no committable work stop the run too.

Do not rebase or switch branches while a factory run is active: the factory and
the rebase share the repository's Git index.

## Checks

From `factory/`:

```sh
npm ci
npm test
npm run typecheck
```

The default suite excludes `@real-agent`. It invokes the public launcher through
a symlink in an isolated workspace, using external machine doubles. It also checks
the default lens, commit-failure ordering, target-only commits (including edits to
tracked files in nested targets), no-change tasks, and last-JSON-line parsing. Passing it verifies orchestration, not the quality of real generated code
or the OO-design verdicts.
