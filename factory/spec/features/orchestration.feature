Feature: Orchestration

  What a pass is, when it ends, and when the factory stops. These
  rules do not care how validation is done.

  Background:
    Given a copy of the factory, in a folder of its own inside a new codebase
    And a seed describing a game of Tetris
    And the planner plans the tasks alpha and beta
    And the doer does the next task in the plan
    And the validator is always satisfied

  Rule: The factory works in the codebase around it

    The factory sits in a folder of its own inside the codebase it builds,
    and builds in the folder around it. The codebase is a git repository;
    the factory commits its work there, and leaves its own folder out of
    those commits.

    A new codebase, for an example, is a new git repository with a copy
    of the factory in it. That is how an example keeps out of the codebase
    you are building.

  Rule: Each pass completes one task, then stops

    Example: Three tasks remain
      Given a plan with three tasks, none of them done
      When the factory runs one pass
      Then the plan shows the first task as done
      And the plan shows the other two as not done
      And the factory has stopped

  Rule: A pass ends when validation is satisfied

    Example: The work is right first time
      Given a plan with three tasks, none of them done
      When the factory runs one pass
      Then the doer has been called once
      And there is one new commit

    Example: The work is wrong first time
      Given a plan with three tasks, none of them done
      And the validator is not satisfied the first time
      When the factory runs one pass
      Then the doer has been called twice
      And there is one new commit

  Rule: A pass gives up after a set number of attempts

    An attempt is the doer producing work and validation deciding on it.
    A doer and a validator can oscillate, each attempt introducing a new
    problem, so a pass cannot be allowed to run forever. How the limit is
    set is up to the student — a flag, a setting, whatever suits what
    they built. A pass that gives up is not committed: the work is left
    where it is, for whoever comes looking.

    Example: Validation is never satisfied
      Given a plan with three tasks, none of them done
      And the factory allows at most three attempts per pass
      And the validator is never satisfied
      When the factory runs one pass
      Then the doer has been called three times
      And it reports that the pass hit its limit
      And there are no new commits
      And the factory has stopped

  Rule: The factory commits a pass that ends with validation satisfied

    Example: One pass, one commit
      Given a plan with three tasks, none of them done
      When the factory runs one pass
      Then there is one new commit
      And it contains the work for the first task

    Example: Finished work is not redone
      Given a plan whose first task is done
      When the factory runs one pass
      Then there is one new commit
      And it contains the work for the second task

  Rule: The factory stops when the planner says the plan is complete

    The planner keeps the plan, so only the planner knows when it is
    complete. It says so in its result: {"complete": true}.

    Example: Work remains
      Given a plan with three tasks, none of them done
      When the factory runs to completion
      Then the plan shows every task as done
      And there are three new commits
      And the factory has stopped

    Example: Every task is already done
      Given a plan in which every task is done
      When the factory runs to completion
      Then the doer has not been called
      And there are no new commits
      And the factory has stopped

  Rule: The factory stops at a result it cannot read

    Each machine answers with a result: JSON describing the job it did.
    The factory reads the planner's and the validator's results to decide
    what happens next, and never looks for words in what they say.

    Example: The validator answers in prose
      Given a plan with three tasks, none of them done
      And the validator answers in prose, with no result
      When the factory runs one pass
      Then it reports that it could not read the validator's result
      And there are no new commits
      And the factory has stopped
