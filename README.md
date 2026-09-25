# capstone-project-starter

Fork this to start working on your factory.

## Get started

1. Fork or clone this repo.
2. `cd tetris/.factory` and fire up your favourite coding agent harness
   (Claude Code, Codex, Pi, etc) there.
3. Say "fetch iteration". It downloads the first homework from the
   [course](https://github.com/lean-software-production/tutorial) into
   `spec/`.
4. Say "coach me" to work through it step by step. When you've finished,
   say "fetch iteration" again for the next one.

## Where things live

- `tetris/` — the game your factory builds. It starts out empty.
- `tetris/seeds/` — what the factory builds from. The sample Tetris seed
  arrives with the first homework.
- `tetris/.factory/` — your factory. You build it here.
  - `spec/` — the current homework: `README.md`, `FACTORY.md` and the
    acceptance criteria in `features/`.
  - `ITERATION` — which homework you're on, and whether it's done.
  - `stand-ins/` — fake agents for quick checks. They're fetched with
    each homework and not committed.
- `tetris/.agents/skills/` — the skills: `fetch-iteration`, `coach-me`,
  `implement-it` and `implement-fast`.
