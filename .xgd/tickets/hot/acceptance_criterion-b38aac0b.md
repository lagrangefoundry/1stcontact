---
uid: acceptance_criterion-b38aac0b
id: AC-2373
type: acceptance_criterion
title: Live browser acquisitions are capped per session at forty, counted at the lease;
  reading something already captured or rendered spends nothing; exhausting the cap
  refuses that one operation naming what ran out and what remains possible, and other
  tools keep working
created_by: xgd
created_at: '2026-11-08T04:36:40.717779+00:00'
updated_at: '2026-11-08T04:36:40.717779+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
On the Worker host, each consultant session has a budget of **40 browser acquisitions**.

- **What spends.** Each live-page browser lease spends one, whether the launch then succeeds or fails. A `screenshot` of a draft, edit, revision or url costs one. A `capture_site` costs one per viewport it loads (a responsive ladder of eight costs eight).
- **What spends nothing.** Operations that read something already captured or already rendered never lease a browser: `list_references`, `describe_reference`, a `screenshot` of a `reference`, and `compare` of two references.
- **When the budget is spent.** The next acquisition is refused before it leases. That operation returns a refusal the model reads as text, beginning `BUDGET:`. The refusal:
  - names the ceiling that ran out (live-page looks);
  - says not to retry it or try the same page another way;
  - says what still works: listing, describing, picturing and comparing captured references, and every site-editing operation.
- **Only that operation is refused.** The turn completes, every other tool keeps working, and the conversation continues.
- **The ceiling.** It is a fixed constant, not a per-deployment setting. The budget is held per session manager in memory, so it bounds a burst within one conversation's isolate rather than a lifetime total.
- **The 1c CLI is unaffected.** Its local browser is not metered, so it has no budget. The shared surface declaration and its overview do not mention a ceiling.

## Verification
Inside workerd, with an injected counting launcher and the shared model double:
- Script 40 live `screenshot` calls followed by a 41st. Assert:
  - the launcher was invoked 40 times;
  - the 41st tool result is a `BUDGET:` refusal naming the 40 looks and listing what still works;
  - a following `set_l1` in the same turn still lands;
  - `list_references` and a `reference` screenshot still return.
- With a launcher that throws, assert that each failed launch still spends one.
- Assert that a `reference` screenshot and a `compare` do not invoke the launcher.