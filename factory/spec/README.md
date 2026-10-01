# Homework 2 — Checking the work

Read `FACTORY.md`, then the feature files in `features/`, and make them
true of the factory you built for homework 1. Together they are the whole
spec, not just the new parts: the rules you already satisfied are still
there, and some of them have changed. A pass is no longer one agent
call: a planner keeps the plan, a doer does the work and a validator
checks it. Your one prompt from homework 1 splits in three.

Before you start, pick what your validator should look for. Testability,
single responsibility, usability, internationalisation, security — any
lens will do, and the interesting part is what your factory does with the
findings. Choose one and write it down.

Your doubles now play three machines. A validator's double answers with
whether it is satisfied and, if not, why: the fields `satisfied` and
`findings` that `machine.feature` has your factory ask for.
