---
uid: todo-0cbdbc66
id: TODO-3
type: todo
title: 'claude_prompt assembly: task payload and inject_tickets missing from spawned
  session'
created_by: xgd
created_at: '2026-08-12T16:47:08.726088+00:00'
updated_at: '2026-08-12T16:47:08.726088+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: review
  auto_merge_back: true
---

## What happened

The `reconciliation_uat_generation_prompt` state of `xgd reconcile REQ-132`
(reconcile-REQ-132, plan item 2, story-3bf94bd4) spawned a builder Claude
session whose prompt contained **only the priming/foundational context** —
`## Session Role: BUILDER`, the architecture/security policies, TDD-PROCESS,
TEST-STRATEGY, FREE-CODING, browser-testing and coding-standards docs — and
**no task payload at all**.

Specifically absent:
- the `reconciliation_uat_generation` prompt body from
  `xgd_source/prompts/reconciliation/reconciliation_uat_generation.yaml`
  (the `messages[0].content` block, including the substituted `story_uid`,
  `anchor_ticket`, `plan_item_index`, `total_items` arguments)
- the `inject_tickets` payload (the story and its acceptance criteria)
- the `reference_tickets` payload (the reconciliation_plan report summary)
- the `context_files` payload (`.xgd/quality.yaml`)

## Evidence

`ps -p <pid> -ww -o command=` on the spawned session showed the complete argv:
84352 characters, ending mid-priming at the coding-standards
"Implementation Checklist". The `-p` prompt began with `## Session Role: BUILDER`
and never contained a `# Reconciliation UAT Generation` heading.

## Why this matters

The session had no statement of its task. It is only recoverable because the
FSM definition, the prompt catalog and the plan report are all readable from
inside the worktree — the session reconstructed the assignment by reading
`reconciliation_story_cycle.yaml`, `reconciliation_uat_generation_prompt.yaml`
and `reconciliation_plan_request-5946d045.json`, then fetched the story and ACs
via `xgd ticket`. A session that did not do that would have produced nothing,
or guessed.

If the defect is in shared `claude_prompt` assembly rather than in this one
prompt, it silently degrades **every** LLM-driven state: the model still runs,
still writes a plausible report, but is working without its instructions or
its injected tickets.

## Uncertainty

The mechanism was not diagnosed — this is a report of the observed prompt, not
a root cause. Worth checking whether priming assembly can overrun a size
budget and drop the trailing task section, since the priming here is ~84KB and
the task payload would have been appended after it.

## Outcome for this run

Not blocking: the task was reconstructed and completed. UATs for AC-1112 to
AC-1116 (plus AC-997, AC-1000, AC-1028) were written to
`tests/reconciliation-copy-edit-image-picker.test.ts`; 8 pass.
