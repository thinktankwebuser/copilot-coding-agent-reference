You are working on a reference POC for **agentic software engineering with GitHub Copilot coding agent**.

The purpose of this repository is **not** to accumulate GitHub Copilot features or reproduce Stripe/OpenAI/DoorDash infrastructure.

The purpose is to learn:

> **What does a software engineer need to do differently when a coding agent becomes the primary implementation worker, and which practices make that model reliable?**

The application is intentionally small so that we can study the **engineering workflow** rather than application complexity.

## Read first

Before making changes, understand:

- `README.md`
- `AGENTS.md`
- `CONTEXT.md`
- `.github/skills/implement-issue/SKILL.md`
- `.github/workflows/verify.yml`
- `.github/workflows/copilot-setup-steps.yml`
- `.github/workflows/plan.md`
- `.github/mcp.json`
- `package.json`

The repository already has:

- issue-scoped implementation guidance
- `AGENTS.md`
- domain context
- an implementation Skill
- `npm run verify`
- CI using the same verification command
- Copilot setup
- GitHub Agentic Workflows `/plan`
- gh-aw MCP configuration
- PR evidence guidance

Do not duplicate existing mechanisms.

Do not add infrastructure just because another company uses it.

Every new mechanism must answer a specific learning question.

---

# Terminology

These terms are used throughout the experiments below. They describe the research process, not the delivery domain; the delivery-domain glossary stays in `CONTEXT.md`.

**Verification**:
The repo-wide `npm run verify` run (format check, lint, typecheck, tests). It proves the repository is still valid, not that a requested behaviour is correct.
_Avoid_: tests pass, CI green

**Acceptance evidence**:
Evidence tied to one specific acceptance criterion of an Issue: a focused test, command output, a diff, or a documented human judgment.
_Avoid_: outcome verification, validation

**Escalation**:
The existing `HUMAN DECISION REQUIRED` mechanism defined in `AGENTS.md`.
_Avoid_: question, blocker

**Agent-operable**:
An Issue a coding agent can complete without human implementation help, while still permitting intentional escalation for consequential decisions.

**Surcharge / Line**:
An individual pricing component (see `CONTEXT.md`). **Rules** is reserved for the published rules table and is never used for a single component.

A justified escalation is not a failure of agent-operability. The experiments test whether the human can stay out of implementation while retaining responsibility for genuinely consequential decisions. This distinction matters most when comparing Experiment 1 with Experiment 3.

---

# Frozen decisions (Experiments 0–3)

Settled on 2026-08-27 before any git change, so the baseline does not move under the experiments.

**Repository state**

- Local `main` is 20 commits behind `origin/main`, which already contains Pricing v2 (PRs #10–#14). The harness files (`CONTEXT.md`, `.github/agents/`, `.github/skills/agentic-workflows/`, `.github/mcp.json`, `plan.md`/`plan.lock.yml`, `copilot-setup-steps.yml`, `.vscode/`, `.gitattributes`, `.prettierignore`) are uncommitted local work.
- Order of operations: preserve the uncommitted work (stash including untracked), fast-forward `main` to `origin/main`, restore, reconcile against the real v2 baseline, run `npm run verify`, open the harness as its own PR.
- README: keep origin's v2 README; port only the short agent-harness/file-layout introduction from the local rewrite. The 739-line v1 dossier is not restored.
- `CONTEXT.md` ships in the harness PR as-is. **Fee cap** is not added to it until the Experiment 1 Issue wording is final; the implementation may then update it as part of the feature.

**`.prettierignore` audit**

- Generated: `.github/workflows/*.lock.yml` — stays ignored.
- Vendored/upstream-managed (installed by gh-aw): `.github/agents/agentic-workflows.md`, `.github/skills/agentic-workflows/` — stay ignored.
- Project-authored control/configuration: `.github/mcp.json`, `.vscode/settings.json`, `.github/skills/implement-issue/` — must not be ignored; the two JSON files get formatted.

**Experiment execution**

- GitHub Copilot coding agent is the implementation worker for every experiment run. Claude analyses evidence afterwards and never dry-runs an Issue first.
- Claude drafts each Issue; the human approves the exact wording and assigns Copilot. The Issue is not modified after assignment.
- Stop after each experiment for human review before the next begins.
- Results live in `docs/experiments/NN-<name>.md`, one per experiment, each containing the eight cross-experiment measurements. `docs/experiments/README.md` is a short index.

**Experiment 1 — Specification**: feature = **fee cap** of 2000 cents on the quote total, applied as a final negative `cap` line so breakdown lines still sum to the total, and published in `GET /rules`. Issue shape: What to build / Acceptance criteria / two worked examples (one capped, one uncapped) / Out of scope. No `npm run verify` criterion in the Issue; `AGENTS.md` owns it. Out-of-scope wording: "Pricing v2 (#4) explicitly excluded fee caps. This Issue introduces fee-cap behaviour as new scope; no other pricing semantics should change."

**Experiment 2 — Outcome verification**: baseline artifact = PR #14 reviewer finding that weight-band and free-delivery-threshold boundaries are not probed while `npm run verify` passes. Do not repair it before documenting it. Evidence form: acceptance matrix (criterion → existing verification result → missing evidence → reviewer finding) in the result document, plus focused tests in the existing `src/*.test.ts`. No PR-template or other mechanism unless the experiment justifies one.

**Experiment 3 — Human judgment**: feature = optional `discountCents` on `POST /quotes`, validated completely (integer, `0 ≤ discountCents ≤ subtotalCents`, otherwise HTTP 400) so that exactly one consequential question stays open: whether the free-delivery threshold and small-order floor compare against the pre- or post-discount subtotal. That question is deliberately left out of the Issue and `CONTEXT.md`.

**Experiments 4–5**: not designed yet; they depend on the evidence from 1–3.

---

# Experimental method

For **every experiment**, use this structure before implementing anything:

## Hypothesis

State exactly what we think might be true.

## Baseline

Establish what the repository does today.

Do not infer this from documentation alone where behaviour can be demonstrated.

## Experiment

Make the smallest change necessary to test the hypothesis.

Avoid redesigning unrelated parts of the repository.

## Evidence

Demonstrate both:

- a meaningful failure or insufficiency in the baseline
- the resulting behaviour after the change

Use observable evidence such as tests, command output, diffs, agent behaviour, CI results, or PR evidence.

## Conclusion

State:

- what the experiment actually demonstrated
- what it did **not** demonstrate
- whether the practice appears specific to GitHub Copilot or transferable to coding agents generally

Do not declare a hypothesis proven merely because the implementation works.

---

# Experiment 1 — Specification

## Learning question

> What information must a human engineer provide for a coding agent to implement a bounded software change correctly without implementation-time intervention?

## Hypothesis

A task becomes more reliably agent-operable when the human clearly provides:

- desired outcome
- scope
- constraints
- acceptance criteria
- useful examples
- explicit out-of-scope boundaries

while leaving implementation details to the agent.

## Baseline

Review:

- existing issues
- `/plan` output
- `AGENTS.md`
- `CONTEXT.md`
- `implement-issue/SKILL.md`

Determine what information an implementation agent currently receives.

Identify what belongs in:

- durable repository instructions
- domain context
- implementation procedure
- the individual issue

Do not duplicate the same information across all four.

## Experiment

Choose one realistic pricing/API change.

Create or refine an issue so that it describes **what must be true**, without prescribing the code implementation.

The issue should contain only information necessary for reliable execution.

Then evaluate whether a coding agent could reasonably:

1. understand the task
2. inspect the repository
3. make implementation decisions
4. complete the change
5. know when it has encountered a genuinely consequential ambiguity

without a human telling it how to code the solution.

## Evidence

Record:

- ambiguities the agent encountered
- questions/escalations
- unsupported assumptions
- implementation intervention required from a human, if any
- whether the final change matched the intended outcome
- whether unnecessary specification constrained the agent

## Conclusion

Answer:

> What does the human need to specify, and what should remain agent responsibility?

---

# Experiment 2 — Outcome verification

## Learning question

> How do we verify that the agent implemented the requested behaviour, rather than merely verify that the repository still passes its existing tests?

## Hypothesis

`npm run verify` is necessary but not sufficient.

A reliable agentic workflow needs verification tied directly to the task's acceptance criteria.

## Baseline

The repository currently provides:

```text
format:check
→ lint
→ typecheck
→ tests
```

Determine what this proves and what it does not prove.

Use a concrete feature example.

For example, if an issue adds a surcharge, distinguish:

```text
repository remains valid
```

from:

```text
requested pricing behaviour is correct
```

## Experiment

For the selected issue, map every acceptance criterion to evidence.

Use a small structure such as:

```text
Acceptance criterion
→ implementation evidence
→ verification evidence
→ mechanically verified? yes/no
```

Where practical, turn behavioural acceptance criteria into focused executable tests.

Do not create tests solely to mirror implementation details.

Prefer externally meaningful behaviour.

Examples might include:

- boundary conditions
- API response contract
- reconciliation between totals and breakdown
- backward compatibility
- explicitly excluded behaviour remaining unchanged

## Evidence

Show:

- whether generic `npm run verify` could pass despite an acceptance criterion being wrong
- what additional verification caught that gap
- which criteria remain judgment-based rather than mechanically verifiable

## Conclusion

Answer:

> What evidence does an engineer need before trusting an agent-produced change?

---

# Experiment 3 — Human judgment

## Learning question

> Which decisions should remain with the human engineer, and which can safely be delegated to the coding agent?

## Hypothesis

The human should primarily own consequential decisions involving:

- product meaning
- unresolved requirements
- public contracts
- architectural direction
- risk acceptance

while implementation-level decisions inside established boundaries can usually remain with the agent.

## Baseline

Review the existing `HUMAN DECISION REQUIRED` mechanism and current agent instructions.

Identify examples of:

### Agent-level decisions

Potential examples:

- choosing an existing helper
- naming a local variable
- choosing an established test pattern
- deciding which file to modify inside an obvious architecture

### Human-level decisions

Potential examples:

- changing public API semantics
- interpreting ambiguous product behaviour
- adding a dependency where policy is unclear
- changing architecture boundaries
- weakening an existing contract

Do not assume these examples are correct for this repository. Determine them from the actual project.

## Experiment

Run a task containing at least one genuine decision point.

Observe whether the agent:

- makes a reasonable implementation decision
- escalates when consequences exceed its authority
- guesses despite insufficient information
- escalates trivial matters unnecessarily

Refine instructions only if observed behaviour demonstrates a real problem.

## Evidence

Record:

- decisions made autonomously
- decisions escalated
- unnecessary escalations
- consequential guesses
- human intervention required

## Conclusion

Answer:

> Where is the useful boundary between agent autonomy and human judgment?

The goal is not maximum escalation.

The goal is **maximum safe autonomy with clear responsibility**.

---

# Experiment 4 — Mechanical boundaries

## Learning question

> Which important engineering rules must be mechanically enforced instead of merely written in agent instructions?

## Hypothesis

Prompt instructions are appropriate for guidance, but important safety and correctness invariants should be enforced by deterministic mechanisms where practical.

## Baseline

Identify current rules that exist only as instructions.

Examples to investigate:

- run `npm run verify`
- stay within issue scope
- do not weaken verification
- do not casually modify agent-control configuration
- do not modify generated files manually

Classify each rule as:

```text
instruction only
mechanically checked
CI enforced
merge-time enforced
```

## Experiment

Choose only one or two high-value boundaries.

Do not build a general security framework.

Candidate experiment A:

> Can an agent complete work while `npm run verify` fails?

If current GitHub Copilot cloud-agent functionality supports a reliable completion hook, evaluate whether mechanical enforcement improves the workflow.

Candidate experiment B:

> Can an ordinary implementation task weaken the mechanisms that verify the agent itself?

Consider files such as:

- `AGENTS.md`
- `.github/skills/**`
- `.github/hooks/**`
- `.github/workflows/**`
- `.github/mcp.json`
- verification scripts/configuration

Distinguish carefully between:

- runtime prevention
- CI detection
- merge-time protection
- human review
- prompt instruction

Use official current GitHub documentation for capability claims.

Do not simulate enforcement using stronger wording in `AGENTS.md`.

## Evidence

For each implemented boundary, demonstrate:

### Failure case

Attempt the behaviour that should not be accepted.

### Success case

Demonstrate allowed normal implementation behaviour.

Show exactly which mechanism caused the distinction.

## Conclusion

Answer:

> Which boundaries are worth enforcing mechanically, and which are adequately handled by agent instructions or human review?

---

# Experiment 5 — Planning and orchestration

## Learning question

> Once a single coding agent can reliably execute a bounded issue, how much planning and task dispatch can safely be automated?

## Hypothesis

Planning automation is useful only if it produces **agent-operable tasks**.

Automatically dispatching poorly defined work simply scales failure.

## Baseline

The repository already provides `/plan`, which can decompose work into sub-issues.

Evaluate existing `/plan` output against what we learned in Experiments 1–4.

Ask:

- Does each sub-issue have a clear outcome?
- Is scope bounded?
- Are dependencies explicit?
- Are acceptance criteria usable?
- Can the implementation agent recognise genuine ambiguity?
- Can success be verified?

Do not evaluate planning quality merely by counting generated issues.

## Experiment A — Planning quality

Give `/plan` a realistic feature specification.

Evaluate the resulting issue decomposition.

Identify:

- good decomposition
- unnecessary fragmentation
- missing dependencies
- ambiguous tasks
- tasks that require shared architectural decisions
- tasks that would be unsafe to dispatch independently

Refine planning guidance only where the evidence warrants it.

## Experiment B — Execution handoff

Only after planning quality is acceptable, investigate the smallest safe transition:

```text
planned
→ blocked or ready
→ implementation
→ verification
→ PR
→ review/merge
```

Use native GitHub or gh-aw capabilities where they genuinely fit.

Do not build a custom orchestrator unless the experiment proves one is necessary.

If native functionality stops at a clean human handoff, document that boundary rather than engineering around it.

## Evidence

Demonstrate:

- one planned task that is genuinely agent-operable
- dependency handling
- readiness decision
- execution handoff
- where human involvement remains necessary

## Conclusion

Answer:

> When does orchestration add value, and when does it merely automate unreliable work?

---

# Cross-experiment measurements

For every implementation task used in these experiments, record a small consistent set of observations:

| Measure                        | Question                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| Human specification effort     | How much did the human need to define?                     |
| Agent clarification/escalation | What couldn't the agent safely decide?                     |
| Human coding intervention      | Did the human need to guide implementation?                |
| Verification failures          | What did deterministic checks catch?                       |
| Acceptance failures            | What escaped generic verification?                         |
| Unsupported assumptions        | Where did the agent guess?                                 |
| Review effort                  | How much human investigation was needed?                   |
| Rework                         | Did the first implementation satisfy the intended outcome? |

Do not invent numerical productivity metrics unless they are genuinely measurable.

Qualitative observations are acceptable when clearly labelled.

---

# Important working rules

1. Establish baseline behaviour before changing anything.
2. Do not add mechanisms without demonstrating the problem they solve.
3. Prefer one small experiment over several speculative improvements.
4. Use official current GitHub/gh-aw documentation for capability claims.
5. Do not rely on memory for changing product behaviour.
6. Test failure paths, not only successful paths.
7. Keep `npm run verify` as the existing general repository verification contract unless evidence justifies changing it.
8. Do not weaken verification merely to make checks pass.
9. Do not manually edit generated files.
10. Inspect the final diff for unrelated changes.
11. Clearly distinguish:

- instruction
- convention
- mechanical enforcement
- CI enforcement
- human judgment

12. Do not claim a practice is generally applicable merely because GitHub Copilot supports it.
13. At the end of each experiment, state whether the learning appears:

- GitHub-specific
- coding-agent-specific
- broadly transferable software-engineering practice

---

# Before starting the experiments

Audit the recent `.prettierignore` changes.

Classify each ignored path as:

```text
generated
vendored/upstream-managed
project-authored control/configuration
ordinary project file
```

Pay particular attention to:

- `.github/agents/**`
- `.github/skills/**`
- `.github/mcp.json`
- `.github/workflows/*.lock.yml`
- `.vscode/**`

Do not exclude project-owned control/configuration files simply because doing so makes `npm run verify` pass.

Generated lock files should remain generator-owned rather than manually reformatted.

Explain and correct any inappropriate exclusion before continuing.

---

# Deliverables

Do **not** implement all five experiments as one large change.

Work sequentially.

Start with:

1. `.prettierignore` audit
2. Experiment 1 — Specification
3. Experiment 2 — Outcome verification

After those, report the findings before making substantial changes for Experiments 3–5.

For every completed experiment provide:

| Field                 | Result |
| --------------------- | ------ |
| Hypothesis            |        |
| Baseline              |        |
| Experiment            |        |
| Evidence              |        |
| Conclusion            |        |
| Transferability       |        |
| Files changed         |        |
| Commands/tests run    |        |
| Remaining uncertainty |        |

Finish with a short answer to the larger question:

> **What did this experiment teach us about how software engineering changes when the coding agent becomes the implementation worker?**
