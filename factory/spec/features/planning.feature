Feature: Planning

  How the plan is made from the seed, and who keeps it true.

  Background:
    Given a copy of the factory, in a folder of its own inside a new codebase
    And a seed describing a game of Tetris
    And the agent plans the tasks alpha and beta, and does one task a pass

  Rule: The seed is the only input to the work

    What to build comes from the seed alone.

    @real-agent
    Example: The work is given a seed and nothing else
      Given the agent is pi
      When the factory runs to completion
      Then Tetris has been built in the codebase

  Rule: The seed is seeds/tetris.md in the codebase

    The factory always looks there. There is no other seed to choose.

    Example: There is no seed
      Given the codebase has no seed
      And no plan
      When the factory runs one pass
      Then it reports that there is no seed
      And no agent has been called
      And there is no plan

  Rule: A pass with no plan writes one, and does nothing else

    Example: A seed with no plan yet
      Given no plan
      When the factory runs one pass
      Then there is a plan
      And the plan shows every task as not done
      And there are no new commits

    Example: A plan already exists
      Given a plan with three tasks, none of them done
      When the factory runs one pass
      Then the plan still has those three tasks

    @real-agent
    Example: The plan comes from the seed
      Given the agent is pi
      And no plan
      When the factory runs one pass
      Then every task in the plan comes from the seed

  Rule: The plan is kept in the factory's folder

    There is one plan: plan.md, next to the factory. The work the factory
    commits to the codebase never includes it.

    Example: The first pass
      Given no plan
      When the factory runs one pass
      Then the plan is plan.md in the factory's folder
      And there is no plan anywhere else in the codebase

  Rule: The agent keeps the plan, and the factory never reads it

    The agent picks the next task, does it and marks it done, all from
    its prompt. The factory only knows whether there is a plan, and the
    agent's result.

    Example: A pass records the work it did
      Given a plan with three tasks, none of them done
      When the factory runs one pass
      Then the plan shows the first task as done

    Example: The next pass carries on from the last
      Given a plan whose first task is done
      When the factory runs one pass
      Then the plan shows the first two tasks as done

    Example: A plan no factory could parse
      Given the agent keeps its plan in prose
      And no plan
      When the factory runs to completion
      Then the work for alpha and beta has been committed
