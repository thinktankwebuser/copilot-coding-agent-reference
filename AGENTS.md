# AGENTS.md

Delivery-quote API. See `README.md` for how to run and verify the project.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and one `docs/adr/` at the repo root, both created lazily. See `docs/agents/domain.md`.

## Implementation contract

Applies to every implementation task, including those run by GitHub Copilot cloud agent.

- The assigned GitHub Issue is the approved scope. Implement what it asks and nothing else: no unrelated refactoring, cleanup, dependency changes, or formatting of untouched code.
- Follow the existing architecture and conventions (see `README.md` and the code in `src/`) unless the Issue explicitly changes them.
- Work is not complete until `npm run verify` passes locally. That is the same command CI runs; do not change CI, verification scripts, or lint/format configuration to make it pass.
- Exception: a check that already fails on the base branch is not yours to fix or configure around. Report it in the PR with the failing check, its output, and the evidence that it is pre-existing, then leave the PR as a draft.
- Do not invent consequential decisions. If the Issue and the repository leave a product, behaviour, API, data-model, architecture, security, or compatibility question genuinely unresolved, stop that part of the work and report it using the escalation format below. Trivial, reversible choices (names, test layout) do not need escalation.

### Escalation format

Put this in the PR description (or the Issue comment, if no PR is opened yet), one block per decision:

```
HUMAN DECISION REQUIRED
Unresolved: <the specific question>
Why it matters: <consequence of getting it wrong>
Blocked: <which part of the work cannot proceed>
Options: <reasonable options with evidence from the Issue or repo, if any>
```

Finish any part of the Issue that does not depend on the answer. If an unresolved decision prevents any acceptance criterion from being completed, leave the PR as a draft and list the blocked acceptance criteria in it. Do not present the Issue as complete.

For the step-by-step procedure, use the `implement-issue` skill in `.github/skills/`.
