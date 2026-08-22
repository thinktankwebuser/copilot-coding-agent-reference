---
name: implement-issue
description: Implement one well-specified, approved GitHub Issue as a bounded, reviewable change with tests and passing verification. Use when assigned an Issue, asked to implement, fix, or build something tracked by an Issue, or when opening a PR for an Issue.
---

# Implement a GitHub Issue

Goal: the smallest coherent change that satisfies the Issue, with tests, passing `npm run verify`, and a PR that explains itself. The scope and escalation rules in `AGENTS.md` apply throughout.

## 1. Understand before editing

- Read the full Issue, including comments. Identify the requested behaviour and acceptance criteria before editing. Do not create repository files merely to record this analysis.
- If any acceptance criterion is missing or contradictory, and the gap is consequential, apply the `HUMAN DECISION REQUIRED` rule from `AGENTS.md` now, before writing code.

## 2. Inspect existing patterns

- Find the code the Issue touches and at least one existing example of the same kind of change (route, rule, validation, test). Match its structure, naming, and error handling.
- Check `README.md` for documented behaviour you must keep or update.

## 3. Implement

- Make only the changes necessary to satisfy every acceptance criterion. Do not make unrelated changes.
- Add or update tests for changed observable behaviour, following the existing patterns (`src/*.test.ts`, Vitest). Ensure every testable acceptance criterion is covered. Do not invent additional requirements merely to increase test coverage.
- Update `README.md` only where the Issue changes documented behaviour.

## 4. Verify

- Run `npm run verify`.
- If it fails because of your change, fix the cause. If a failure is unrelated to your change, do not work around it; report it in the PR.
- Do not edit lint, format, typecheck, test, or CI configuration to get a pass.

## 5. Check the result

- Re-read the Issue. Confirm each acceptance criterion is met by a specific test or change; list any that are not.
- Review the full diff (`git diff`) for anything outside the Issue's scope. Revert it.

## 6. PR evidence

In the PR description include:

- The Issue reference and a one-paragraph summary of what changed and why.
- Which tests were added or changed and what they prove.
- The verification command run and its result.
- Any `HUMAN DECISION REQUIRED` blocks, the acceptance criteria they block (PR stays a draft), unresolved failures, or deliberate deviations from the Issue.
