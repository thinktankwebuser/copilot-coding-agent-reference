---
name: implement-issue
description: Implement one well-specified, approved GitHub Issue as a bounded, reviewable change with tests and passing verification. Use when assigned an Issue, asked to implement, fix, or build something tracked by an Issue, or when opening a PR for an Issue.
---

# Implement a GitHub Issue

Goal: the smallest coherent change that satisfies the Issue, with tests, passing `npm run verify`, and a PR that explains itself. The scope and escalation rules in `AGENTS.md` apply throughout.

## 1. Understand before editing

- Read the full Issue, including its comments: `gh issue view <number> --json number,title,body,labels,comments --jq '{number, title, body, labels: [.labels[].name], comments: [.comments[].body]}'`. Do not pass `--comments`; `gh` ignores it whenever `--json` is present, and the comments then go missing without an error.
- Identify the requested behaviour and acceptance criteria before editing. Do not create repository files merely to record this analysis.
- If any acceptance criterion is missing or contradictory, and the gap is consequential, apply the `HUMAN DECISION REQUIRED` rule from `AGENTS.md` now, before writing code.

## 2. Inspect existing patterns

- Find the code the Issue touches and at least one existing example of the same kind of change (route, rule, validation, test). Match its structure, naming, and error handling.
- Check `README.md` for documented behaviour you must keep or update.

## 3. Implement

- Make only the changes necessary to satisfy every acceptance criterion. Do not make unrelated changes.
- Add or update tests for changed observable behaviour, following the existing patterns (`src/*.test.ts`, Vitest). Ensure every testable acceptance criterion is covered. For acceptance criteria involving boundaries, thresholds, ranges, limits, or comparisons, identify and test the meaningful boundary conditions and adjacent cases; for numeric or ordered values, consider cases below, at, and above the boundary where applicable. Do not invent additional requirements merely to increase test coverage.
- Update `README.md` only where the Issue changes documented behaviour.

## 4. Verify

- Run `npm run verify`.
- If it fails because of your change, fix the cause. If a failure is unrelated to your change, follow the unrelated-failure rule in `AGENTS.md`: do not fix it, do not work around it, report it in the PR with evidence that it is pre-existing, and leave the PR as a draft.
- Do not edit lint, format, typecheck, test, or CI configuration to get a pass.

## 5. Check the result

- Re-read the Issue. Confirm each acceptance criterion is met by a specific test or change; list any that are not.
- Review the complete diff of the PR against its base: `gh pr diff` from the branch, or `gh pr diff <number>`. This is the diff GitHub itself computes, so it needs no local base branch, no remote-tracking ref, and no assumption that the base is `main`. Push the branch and open the PR (as a draft, if it is not open yet) before running this: it reports the diff for the pushed head, so an unpushed commit is invisible to it and the check would pass on stale content. Do not use bare `git diff` here: it shows only uncommitted work, so anything you already committed on the branch would escape this check.
- For every file in that diff, name the acceptance criterion it serves. A file you did not edit by hand still belongs if satisfying the Issue produced it: a lockfile updated by an Issue-mandated dependency change, a regenerated snapshot or build output, a `README.md` section the Issue changes. Revert only what serves no criterion; do not revert a consequence of the change and leave the repository inconsistent.

## 6. PR evidence

In the PR description include:

- The Issue reference and a one-paragraph summary of what changed and why.
- Which tests were added or changed and what they prove.
- How each acceptance criterion was verified (a test, command output, or the diff), and any criterion that could not be verified, with the reason.
- The verification command run and its result.
- Any `HUMAN DECISION REQUIRED` blocks, and which acceptance criteria each one blocks. An escalation that blocks no acceptance criterion does not by itself hold the PR back; the draft rules in `AGENTS.md` still apply.
- Any unrelated verification failure, and any deliberate deviation from the Issue.
