Feature: Public entrypoint and commit-boundary regression checks
  Background:
    Given a copy of the factory, in a folder of its own inside a new codebase
    And a seed describing a game of Tetris
    And the planner plans the tasks alpha and beta
    And the doer does the next task in the plan
    And the validator is always satisfied

  Scenario: The selected OO-design lens is the default
    Given a plan with three tasks, none of them done
    When the factory runs one pass
    Then the validator was given "Sandi Metz"
    And the validator was given "Rebecca Wirfs-Brock"
    And the validator was given "David West"
    And the validator was given "Kent Beck"
    And the validator was given "Ward Cunningham"
    And the validator was given "Smalltalk"

  Scenario: A failed commit does not advance the plan
    Given a plan with three tasks, none of them done
    And Git rejects the commit
    When the factory runs one pass
    Then it reports the Git commit failure
    And there are no new commits
    And the plan shows every task as not done
    And the planner has not been asked to record committed work

  Scenario: Unrelated staged changes are not committed with the target
    Given a separate target with an unrelated staged change beside it
    And a plan with three tasks, none of them done
    When the factory runs one pass
    Then there is one new commit
    And the unrelated change remains staged and uncommitted

  Scenario: Existing tracked files can be edited in a nested target
    Given a separate target with an unrelated staged change beside it
    And a plan with three tasks, none of them done
    And the next task edits an existing tracked file
    When the factory runs one pass
    Then there is one new commit
    And the tracked task file's change is committed
    And the unrelated change remains staged and uncommitted

  Scenario: A task without committable work does not advance the plan
    Given a plan with three tasks, none of them done
    And the doer produces no file changes
    When the factory runs one pass
    Then it reports that there is no committable work
    And there are no new commits
    And the plan shows every task as not done

  Scenario: An invalid last JSON line does not fall back to an earlier verdict
    Given a plan with three tasks, none of them done
    And the validator follows its verdict with JSON that has no verdict fields
    When the factory runs one pass
    Then it reports that it could not read the validator's result
    And there are no new commits
    And the plan shows every task as not done
