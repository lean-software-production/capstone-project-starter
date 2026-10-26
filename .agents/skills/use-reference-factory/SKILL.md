---
name: use-reference-factory
description: Get the reference factory ready to build tetris-000, and tell the student what to type. Use when the student says "use the reference factory to build tetris-000", or asks to use or try the reference factory.
---
Get the course's reference factory ready, so the student can watch it build a Tetris in `tetris/tetris-000`. You prepare everything; the student types the two commands themselves, in a terminal, because `watch` needs a real terminal and these are the commands their own factory will answer to later.

Open the agent at the repository root. Paths below are relative to it. The line is in `tetris/tetris-000/.assembly-lines/implement-with-ralph-loop/`, with two machines in its `machines/` folder, `planner` and `ralph`. Each has a `machine.json` naming its model, `openai-codex/gpt-6.1-sol` by default.

1. Run `bin/doctor`. If it doesn't say `Environment is ready`, stop and tell the student to fix their setup first (the README's step 2), then ask again.
2. Run `bin/get-reference-factory`. It downloads the reference factory, checks it and installs `bin/reference-factory`. If it fails, show the student its message and stop.
3. Find out how the student is signed in to Pi, and get both machines ready. Use `~/.pi/agent/auth.json` to see which providers they have logins for, but print only the provider names, never the contents.
   - **A login in `~/.pi/agent/auth.json`:** copy it into both machines (`machines/planner/` and `machines/ralph/`) and set mode 600 on each copy.
   - **Only an API key in the environment** (for example `OPENROUTER_API_KEY`): copy nothing. Pi uses the key from the environment.
   - **The default model's provider isn't reachable:** run `pi auth check --provider openai-codex --no-refresh`. If it doesn't say `ready`, and there's no API key for that provider in the environment, find the provider the student is signed in to (the names in `auth.json`, or the provider of the API key they have). Show them the models from `pi --list-models <provider>`, and let them choose. Write `{"harness": "pi-rpc-acp", "model": "<provider>/<model>"}` as both `machine.json` files. Tell them the timing in the README was measured on the default model, so theirs may differ.
4. Check, and stop at the first check that fails, saying what to do:
   - `bin/reference-factory --version` runs and prints `factory <version>`;
   - `pi auth check --provider <provider> --no-refresh` says `ready` for the provider both machines name (the part of `model` before the `/`), or that provider's API key is in the environment;
   - with a login, `auth.json` exists in both machines.
5. Look at the run before you show any command. If `tetris/tetris-000/.assembly-lines/implement-with-ralph-loop/runs/tetris/` exists:
   - **It finished**, which means the last line of its `record.jsonl` has `"kind":"run"` and `"state":"finished"`: say `tetris-000` is already built, give the play command (below) and stop. Don't start a second build.
   - **Otherwise** it was interrupted or stopped on an error: say the same two commands carry it on, and show them (step 6).
6. Show the student the two commands, verbatim, to type in a terminal at the repository root, one after the other. The first starts the run and gives the terminal back; the second watches it:

   ```sh
   bin/reference-factory --run tetris --target tetris/tetris-000 --line implement-with-ralph-loop --seed tetris/spec.md
   bin/reference-factory watch tetris --target tetris/tetris-000
   ```

   Say the second shows the build live, and that it takes about 15 minutes. If a run stops with an error, such as "ended its turn having generated nothing", they type the same first command again and it carries on with the finished tasks kept. If it fails again within seconds of starting, check the Pi sign-in.

   When the run is complete, give them the play command:

   ```sh
   npm --prefix tetris/tetris-000 start
   ```

## Rules

- Never type the two commands for the student, or start the build yourself.
- Don't edit anything in `factory/`.
- Don't fetch an iteration. The student says "fetch iteration" when they're ready for Homework 1.
- Never print, commit or paste the contents of `auth.json`. `.gitignore` keeps the copies out of Git; leave it that way.
- Don't start a second build of `tetris-000` when a run exists.
