# The factory, as of this iteration

The factory builds software from a seed, one task at a time. A planner
keeps the plan, a doer does each task and a validator checks it. The
validator only reports; the doer records each finding and tries again,
and the pass gives up after a set number of attempts. Once the work is
committed, the planner marks the task done, and it says when the plan is
complete.

The factory writes no project code, no plan and no verdict itself, and
never reads the plan. Its three machines do — the planner, the doer and
the validator — each run by a harness: `pi` by default, or another
chosen for the run. Each machine answers with a result, a line of JSON
describing the job it did, and the factory reads the planner's and the
validator's results to decide what happens next.

The factory sits in a folder of its own inside the codebase it builds,
and builds in the folder around it. Its seed, saying what to build, is
`seeds/tetris.md` in the codebase. It keeps its one plan in its own
folder.

New since iteration 1: `validation.feature`; passes that end on
validation; and a planner, which takes the plan over from the one agent.
