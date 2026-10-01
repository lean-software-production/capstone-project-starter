# The factory, as of this iteration

The factory builds software from a seed, one task at a time. On each
pass it calls a coding agent, which writes a plan from the seed if there
is none, and otherwise does the next task and marks it done. The factory
commits the work, and stops when the agent's result says the plan is
complete. Nothing checks the work yet.

The factory writes no project code and no plan itself, and never reads
the plan. A coding agent does all of that — `pi` by default, or another
chosen for the run.

The factory sits in a folder of its own inside the codebase it builds,
and builds in the folder around it. Its seed, saying what to build, is
`seeds/tetris.md` in the codebase. It keeps its one plan in its own
folder.

Running one pass does one task, or writes the plan. Running to
completion keeps going until the agent's result says the plan is
complete.
