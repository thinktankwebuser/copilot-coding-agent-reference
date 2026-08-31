# Experiment 1 — Specification

This document records the result of Experiment 1 as defined in `experiments.md`.
The implementation run it analyses is GitHub Issue #16 ("Cap the delivery fee at
2000 cents") and Pull Request #17, implemented by GitHub Copilot coding agent and
merged into `main` on 2026-08-28.

Evidence labels used below:

- **Observed** — directly visible in the Issue, PR, commits, diff, review, or CI records.
- **Inference** — a conclusion drawn from observed evidence, but not directly recorded.
- **Not observable** — evidence that could not be accessed (see limitations).

**Evidence limitation.** The Copilot coding agent's session log (its internal
steps, commands run, and any local `npm run verify` output) was not accessible
for this analysis. Claims about what the agent did locally are therefore marked
**Not observable** rather than inferred.

## 1. Learning question

> What information must a human engineer provide for a coding agent to implement
> a bounded software change correctly without implementation-time intervention?

## 2. Hypothesis

A task becomes more reliably agent-operable when the human clearly provides:

- desired outcome
- scope
- constraints
- acceptance criteria
- useful examples
- explicit out-of-scope boundaries

while leaving implementation details to the agent.

## 3. Baseline

Before Issue #16, an implementation agent in this repository received four
layers of durable information, with distinct responsibilities and no
duplication of the task-specific content:

- **`AGENTS.md`** (durable repository instructions): the Issue is the approved
  scope, `npm run verify` must pass, and unresolved consequential decisions are
  escalated with a `HUMAN DECISION REQUIRED` block instead of guessed at.
- **`CONTEXT.md`** (domain context): the pricing vocabulary — quote, base fee,
  surcharge, breakdown, rules — with no implementation detail.
- **`.github/skills/implement-issue/SKILL.md`** (implementation procedure): read
  the Issue and comments, match existing patterns, make the smallest coherent
  change, verify, review the PR diff, and include specific PR evidence.
- **The individual Issue**: the only place task-specific behaviour is defined.

Verification baseline: `npm run verify` runs `format:check`, `lint`,
`typecheck`, and the test suite, and `.github/workflows/verify.yml` runs the
same command in CI on pull requests and pushes to `main`. This proves the
repository remains valid; it does not by itself prove that a newly requested
behaviour is correct (that distinction is the subject of Experiment 2).

## 4. Experiment

The feature was frozen in `experiments.md` before the Issue was written: a fee
cap of 2000 cents on the quote total, applied as a final negative `cap`
breakdown line so the lines still sum to the total, and published in
`GET /rules` as `maxDeliveryFeeCents`.

**What Issue #16 supplied** (Observed — Issue #16 body):

- **What to build**: the cap behaviour described as required outcomes ("If
  their total exceeds 2000 cents, append a final negative `cap` breakdown
  line…"), not as code instructions. No file names, function names, or
  implementation steps appear anywhere in the Issue.
- **Six acceptance criteria**: the fee never exceeds 2000; the capped-case
  breakdown shape; the unchanged uncapped case; breakdown lines always sum to
  the total; `GET /rules` includes `maxDeliveryFeeCents: 2000`; and `README.md`
  documents the cap with a matching example response.
- **Two worked examples**: one capped request/response pair (2900 pre-cap, `cap`
  line of −900) and one uncapped pair (1200, no `cap` line), with full JSON.
- **An explicit out-of-scope boundary**: fee caps were excluded from Pricing v2
  (#4); this Issue introduces them as new scope, and no other pricing semantics
  may change.

The Issue deliberately contained no `npm run verify` criterion; `AGENTS.md`
owns that requirement (Observed — frozen decision in `experiments.md`, and the
Issue text).

**Run timeline** (Observed — Issue #16 timeline, PR #17 commits and reviews,
all 2026-08-28 UTC):

1. 10:07:44 — the human assigned the Issue to Copilot.
2. 10:07:49 — Copilot opened PR #17 ("Initial plan" commit).
3. 10:09:45 — commit `16054aa` "feat: cap delivery fees at 2000 cents": the
   full implementation (`src/quote.ts`, `src/app.ts`), tests (`src/quote.test.ts`,
   `src/app.test.ts`), and the `README.md` update.
4. 10:10:16 — commit `f65a993` "docs: format delivery fee cap docs": a
   follow-up formatting-only adjustment (Inference from the commit message: a
   self-caught formatting issue, consistent with the `format:check` step of
   `npm run verify`).
5. 10:20:05 — the automated Copilot pull-request reviewer submitted a "Changes
   recommended" review with one inline comment (see section 5).
6. 10:22:52 — commit `2dbd7d4` "Potential fix for pull request finding":
   authored by the human's account via the GitHub web UI, co-authored by
   "Copilot Autofix powered by AI". It adds one test and changes nothing else.
7. 10:23:06 — the human approved the PR.
8. 10:23:12 — the CI `verify` check on the final commit completed successfully.
9. 10:23:19 — the human merged the PR; the Issue closed at 10:23:20.

Elapsed time from assignment to merge: roughly 15 minutes (Observed).

**Clarification and escalation**: the agent asked no questions and raised no
`HUMAN DECISION REQUIRED` block. Issue #16 has zero comments, and the PR
description contains no escalation block (Observed).

## 5. Evidence

### What the initial PR implemented

(Observed — PR #17 diff, commits `16054aa` and `f65a993`.)

- `src/quote.ts`: exports `MAX_DELIVERY_FEE_CENTS = 2000`, adds `'cap'` to the
  breakdown-line code union, computes the uncapped total, appends a `cap` line
  only when the total is strictly greater than the maximum, and returns
  `Math.min(uncappedTotal, MAX_DELIVERY_FEE_CENTS)` as the fee.
- `src/app.ts`: publishes `maxDeliveryFeeCents` in `GET /rules`.
- `src/quote.test.ts` and `src/app.test.ts`: unit and API tests for the capped
  worked example (including a breakdown-sums-to-total assertion), the cap in
  the `/rules` response, and an uncapped case.
- `README.md`: the cap in the Delivery rules table, the breakdown order, and
  the updated `GET /rules` example.

The implementation matched the Issue's intended outcome, including both worked
examples reproduced as test expectations (Observed — diff versus Issue text).

### What the PR review found

(Observed — review of 2026-08-28 10:20:05 and its single inline comment on
`src/quote.test.ts`.)

The automated Copilot reviewer recommended changes with one finding: the
acceptance criterion distinguishes totals of exactly 2000 from totals above
2000, but the tests only exercised the greater-than branch — the uncapped test
cases were all below the boundary. It asked for an exact-2000 case asserting no
`cap` line and a breakdown that still sums to the total.

**Classification of this finding.** It was **missing test coverage /
acceptance evidence, not a functional defect**:

- The code uses a strict comparison (`uncappedDeliveryFeeCents >
MAX_DELIVERY_FEE_CENTS`), so a total of exactly 2000 gets no `cap` line and
  an unchanged quote — exactly what the acceptance criterion requires
  (Observed — `src/quote.ts` in the PR diff).
- The corrective commit `2dbd7d4` adds only a test
  (`leaves a quote at the maximum unchanged without a cap line`, exercising a
  quote of exactly 2000) and touches no production code. That test passed
  against the unmodified implementation in the CI run that followed
  (Observed — the commit's patch and the successful `verify` check on it).

The runtime behaviour at the boundary was therefore already correct; what was
missing was the evidence proving it.

### What changed in response

(Observed — commit `2dbd7d4`.) One 16-line test was added to
`src/quote.test.ts`. The commit was made through the GitHub web UI by the
human's account with "Copilot Autofix powered by AI" as co-author. This was
**AI-generated corrective work accepted by a human**, not direct human-written
implementation: the human's recorded action was applying the suggested fix, and
no hand-written implementation or test code from the human appears anywhere in
the PR.

### What CI verified

(Observed — GitHub Actions runs for the PR branch.)

- The `verify` workflow run on the final commit `2dbd7d4` executed and passed
  (completed 10:23:12, before the 10:23:19 merge).
- The three earlier `pull_request` runs on the branch (on commits `b9ba0ab`,
  `16054aa`, `f65a993`) are recorded as failures **with zero jobs executed** —
  they failed at workflow startup, so the `verify` command never actually ran
  on those commits in CI. These were not code failures (Observed that no job
  ran; the cause of the startup failure is **Not observable** from the run
  records; a plausible cause is a restriction on Copilot-triggered workflow
  runs — Inference, unverified).
- Whether the agent ran `npm run verify` locally during implementation is
  **Not observable** (session log inaccessible). The "docs: format" follow-up
  commit is weak indirect evidence of a local format check catching something
  (Inference).

Net effect: the merged state was CI-verified exactly once, on the final commit.

### PR-evidence compliance with `implement-issue/SKILL.md`

Section 6 of the skill requires the PR description to include: the Issue
reference and summary; which tests were added and what they prove; **the
verification command run and its result**; any `HUMAN DECISION REQUIRED`
blocks; any unrelated verification failure or deliberate deviation.

(Observed — PR #17 description.)

- Issue reference ("Fixes #16") and a summary of what changed and why: present.
- Tests added and what they prove (a "Coverage" section naming the capped,
  uncapped, and breakdown-sum checks): present.
- **The verification command and its result: absent.** The PR description
  nowhere states that `npm run verify` was run or what it reported. This is a
  deviation from the skill's PR-evidence requirements, and it matters here
  because the CI runs on the agent's own commits never executed — so at review
  time there was no recorded verification evidence at all for the agent's work.
- Escalation blocks and unrelated-failure reports: none present, and none were
  required (no escalation occurred; the startup-failed CI runs post-date the
  skill's local-verification step and were not reported either).

### What the human did before merging

(Observed.) The human: wrote/approved and assigned Issue #16; applied the
AI-suggested boundary test via the web UI; approved the PR; and merged it after
the final CI `verify` run passed. The human wrote no implementation or test
code by hand and gave no implementation guidance during the run.

### Distinguishing the kinds of evidence in this run

- **Functional correctness**: supported by the tests reproducing both worked
  examples and, after review, the exact-2000 boundary test — all passing in the
  final CI run.
- **Repository-wide verification**: `npm run verify` in CI — executed and
  passed only on the final commit.
- **Acceptance-criterion evidence**: focused tests exist for all six criteria
  (fee ceiling, capped shape, uncapped unchanged, breakdown sum, `/rules`
  field, README update — the last verified by diff rather than test). The
  exact-2000 case was the one criterion initially without direct evidence.
- **Automated-agent implementation**: all production code, tests, and
  documentation in commits `16054aa` and `f65a993`.
- **AI-generated corrective work accepted by a human**: commit `2dbd7d4`.
- **Direct human-written implementation**: none.

## 6. Cross-experiment measurements

| Measure                        | Evidence-based result                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Human specification effort     | Substantial and front-loaded: Issue #16 is a full specification (~110 lines) with an outcome description, six acceptance criteria, two fully worked request/response examples, and an explicit out-of-scope statement. The human also approved the exact wording before assignment (Observed — Issue #16; frozen decisions in `experiments.md`).                                |
| Agent clarification/escalation | None. Zero Issue comments, zero `HUMAN DECISION REQUIRED` blocks, no draft-PR escalation (Observed). No consequential ambiguity appears to have been left open by the Issue (Inference).                                                                                                                                                                                        |
| Human coding intervention      | None hand-written. The only human-authored commit applies an AI-generated test via the GitHub web UI (Observed — commit `2dbd7d4` authorship).                                                                                                                                                                                                                                  |
| Verification failures          | No code-caused CI failures observed. The three CI runs on the agent's commits failed at startup with zero jobs executed, so CI verification effectively ran once, on the final commit, and passed. Local verification by the agent is Not observable; the "docs: format" commit weakly suggests one self-caught formatting issue (Observed/Inference as labelled in section 5). |
| Acceptance failures            | One: the exact-2000 boundary criterion had no test in the initial PR. This escaped nothing at runtime — behaviour was already correct — but the acceptance evidence was missing until review demanded it (Observed).                                                                                                                                                            |
| Unsupported assumptions        | None observed that contradict the Issue. Implementation choices (constant export, strict `>` comparison, `Math.min`, test placement) stayed within the Issue's stated outcomes and existing repository patterns (Observed — diff).                                                                                                                                              |
| Review effort                  | Light. One automated review producing one finding, then a human approval; about three minutes elapsed between the applied fix and the merge. No recorded human line-by-line investigation beyond approval (Observed timestamps; depth of the human's reading is Not observable).                                                                                                |
| Rework                         | Minimal: one 16-line test commit. No production code was reworked; the first implementation satisfied the intended runtime outcome (Observed).                                                                                                                                                                                                                                  |

## 7. Conclusion

**Answer to the experiment question — what does the human need to specify, and
what should remain agent responsibility?**

On this run's evidence:

- **The human supplied product meaning, constraints, examples, invariants and
  exclusions** — supported. Issue #16 carried the outcome, the six criteria,
  the breakdown-sum invariant, two worked examples, and the Pricing-v2
  exclusion; the durable layers (`AGENTS.md`, `CONTEXT.md`, the skill) carried
  everything task-independent.
- **The agent handled repository inspection, implementation choices, code
  changes, tests and documentation** — supported. All implementation content
  is agent-authored and follows existing repository patterns, with no
  implementation direction visible from the human.
- **No implementation-time clarification was required** — supported. No
  questions, comments, or escalation blocks exist anywhere in the run.
- **Review still added value by finding an acceptance-evidence gap** —
  supported, with the precise classification that the gap was missing boundary
  test coverage, not a runtime defect. The specification's own sharp boundary
  ("exactly 2000" versus "above 2000") is what made the gap findable.
- **The run supports the usefulness of bounded specifications but does not
  prove they eliminate review or guarantee complete verification evidence** —
  supported, and the second half is reinforced by two observations: the initial
  PR's test suite missed a specified boundary, and the PR description omitted
  the verification command and result that the skill requires while the CI runs
  on the agent's commits never actually executed.

No repository evidence contradicted any of these five statements.

**Calibration.** This is one run of one small, well-bounded feature in a
repository purpose-built for agent operation, implemented by one agent, with
the specification frozen in advance by the same people running the experiment.
It shows that this specification shape was _sufficient_ for this task; it does
not show it was _minimal_ (nothing tested whether a leaner Issue would also
have succeeded, or whether any part of the specification over-constrained the
agent), and it does not show the hypothesis holds for larger, more ambiguous,
or architecturally consequential changes.

## 8. What this did not demonstrate

- That bounded specifications eliminate the need for review — the opposite: the
  one substantive finding of the run came from review.
- That `npm run verify` plus agent self-report guarantees verification
  evidence: the PR description omitted the required verification report, and CI
  never executed on the agent's own commits, so before the final human-applied
  commit there was no recorded proof of verification at all.
- That the agent escalates well — no genuine ambiguity was present, so the
  escalation mechanism was never exercised (that is Experiment 3's subject).
- That acceptance criteria reliably become acceptance evidence without an
  additional check — the exact-2000 gap shows criteria can be met in code yet
  unevidenced in tests (that is Experiment 2's subject).
- Whether a smaller specification would have failed; there was no control run.
- Anything about multi-issue, multi-agent, or long-running work.

## 9. Transferability

- **GitHub-specific**: the concrete mechanics — Copilot coding agent assignment,
  the automated Copilot PR reviewer, "Copilot Autofix" suggested fixes applied
  from the web UI, and the zero-job startup failures on agent-triggered
  workflow runs.
- **Coding-agent-specific**: the layering that this experiment exercised —
  durable contract (`AGENTS.md`), domain glossary (`CONTEXT.md`), procedure
  (skill), and a per-task Issue holding only task-specific outcomes — is a
  structure aimed at any implementation agent, not only Copilot.
- **Broadly transferable software-engineering practice**: specifying outcomes,
  acceptance criteria, worked examples, invariants, and explicit non-goals
  rather than implementation steps; and the observation that a sharply stated
  boundary in a specification gives a reviewer (human or automated) something
  concrete to check coverage against. These predate coding agents and appear
  to be what did the work here (Inference from a single run).
