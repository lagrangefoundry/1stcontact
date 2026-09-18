---
uid: report-e0a4cad5
id: REPORT-4342
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:44:39.227139+00:00'
updated_at: '2026-09-18T07:44:39.227139+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

Cherry-pick of `876811161c` ("Merge branch 'free-BUG-39' into xgd-working",
mainline = parent 1 `ab2f423dde`). 7 conflicted paths, all resolved.

## Files resolved

- `tests/support/scripted-model-client.ts` — **AA** (both added), rule 2b.
  HEAD's version is a strict superset of the incoming one: identical module
  header, `scriptedClient` / `says` / `calls` / `WireEvent` / `ScriptedClient`
  unchanged, plus `modelSaw` + `textOf` (placement-agnostic request reading),
  `stalls` / `StalledStep` (a turn held open mid-flight), a widened
  `ModelRequest.system` (`string | {type,text}[]`), a widened `ModelStep`
  (`WireEvent[] | AsyncIterable<WireEvent>`) and the `for await` loop that
  consumes it. Diffing incoming→HEAD removes only the five lines those
  widenings replace. Kept the superset (`git checkout --ours`).

- `tests/reconciliation-assistant-conversation-knowledge.test.ts` — **UU**, 2c.
  Sole hunk was the import block: HEAD additionally has
  `import type { ModelRequest } from './support/scripted-model-client'`;
  incoming had nothing there. Kept both lines (the incoming's
  `import { says, scriptedClient }` had already merged clean above the hunk).

- `tests/reconciliation-assistant-conversation.test.ts` — **UU**, 2c.
  Sole hunk was the named-import list. HEAD imports
  `{ calls, modelSaw, says, scriptedClient, stalls }`, incoming imports
  `{ calls, says, scriptedClient }` — HEAD is a superset of the incoming set,
  kept HEAD.

- `tests/reconciliation-draft-change-journal.test.ts` — **UU**, 2c.
  Same shape: HEAD `{ calls, modelSaw, says, scriptedClient }` ⊃ incoming
  `{ calls, says, scriptedClient }`. Kept HEAD.

- `tests/test_UAT_FC_REQ-131_change_journal.test.ts` — **UU**, 2f (UAT file).
  Same shape: HEAD `{ modelSaw, says, scriptedClient }` ⊃ incoming
  `{ says, scriptedClient }`. Kept HEAD. No test function was deleted — all 13
  `test_UAT_FC_REQ_131_*` cases are present, including
  `..._the_reminder_carries_the_signal_only_when_something_changed`, the one
  the incoming commit edited.

- `package.json` — **UU**, 2g scalar, resolved AGAINST the "incoming wins"
  default and flagged here. The incoming hunk is the free-coded bookkeeping
  bump `0.2.14 → 0.2.15`; HEAD carries `0.2.40`. Taking incoming would regress
  the package version by 25 releases. Version is monotonic bookkeeping, not
  config intent, so HEAD's `0.2.40` was kept. (The incoming's own claim on
  `0.2.15` is preserved: it survives in the ticket's `fields.version`.)

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — **UU**, 2e (intent/bookkeeping
  ticket), composed per-fact rather than picking a side:
  - *Frontmatter* — HEAD is the later, strict superset: `status: bundled` (vs
    incoming's `free_coding`), `updated_at` 2026-08-31 (vs 2026-08-25),
    `last_field_updated: status`, and the `fields` keys incoming never had
    (`commits` with `working_sha 759cd874`, `version: 0.2.15`,
    `story_points: 3`, `bundled_in: bundle-8eef3846`). Kept HEAD's
    frontmatter whole — advancing status back to `free_coding` and dropping
    the bundle linkage would have reverted operator/workflow-owned lifecycle
    state.
  - *Body* — the two sides state the SAME facts; they differ only in
    rendering. HEAD's copy has been through a serialization round-trip that
    flattened the "Fix — as landed" markdown table into 24 loose lines,
    dropped the `ts` language tag off the fence, and unwrapped every
    paragraph. Incoming's is the developer-authored original. No fact differs,
    so took the incoming body verbatim — this also removes a duplicated
    "blast radius" paragraph that git's automerge had already produced from
    the two wrappings of the same sentence.

## Incoming changes preserved

BUG-39's effect is already integrated into HEAD (a post-watermark sync landed
this work in refined form), so every conflict here was HEAD-side refinement of
the same change rather than a competing edit. Verified per file against
`git diff 876811161c^1 876811161c -- <file>`:

- `scripted-model-client.ts` — every exported symbol the incoming commit
  introduced (`ModelRequest`, `WireEvent`, `ModelStep`, `ScriptedClient`,
  `scriptedClient`, `says`, `calls`) is present in the resolved file, including
  the full module-header contract note. Nothing incoming was dropped.
- `reconciliation-assistant-conversation-knowledge.test.ts` — the incoming's
  import is present (line 43) and its body rewrite is present: the inline
  `setModelClient({messages: {create: ...}})` double is gone, replaced by
  `scriptedClient([says('Understood.')])` + `setModelClient(client)` +
  `const seen = client.seen` (lines 520–522).
- `reconciliation-assistant-conversation.test.ts` — the inline `ModelRequest`
  interface, inline `scriptedClient`, and the pre-streaming `says`/`calls` the
  incoming deleted are all absent; the incoming's replacement comment ("The
  model double is the shared one (BUG-39)…") is present at line 81.
- `reconciliation-draft-change-journal.test.ts` — the inline `ModelStep` /
  `scriptedClient` / `says` / `calls` block the incoming deleted is absent; the
  incoming's replacement comment is present at line 689.
- `test_UAT_FC_REQ-131_change_journal.test.ts` — the inline pre-streaming
  `scriptedClient(replies: string[])` the incoming deleted is absent; the
  incoming's replacement comment is present at line 344, and the call site is
  the incoming's `scriptedClient([says('Right.')])` (line 387).
- The rest of the incoming commit merged without conflict, including the new
  `tests/test_UAT_FC_BUG-39_model_double_contract.test.ts` (present in the
  tree) and the six other suites it converted.

No hunk was dropped under the BUG-1301 precedence exception — nothing had to be
deleted, and no test function on either side was removed.

## Note for the finalize step

Staged diff vs HEAD is the ticket body only; the six code paths resolved to
content byte-identical to HEAD. That is the redundant-commit case
(BUG-1109/BUG-1122), not a discard — STEP 3 above confirms the incoming
commit's key changes are all PRESENT in HEAD, reaching it by the earlier sync
route. `--skip` was not called; CHERRY_PICK_HEAD (`876811161c`) is intact.

## Flagged for post-merge review

- `package.json` — HEAD's `0.2.40` kept over the incoming's `0.2.15`
  (monotonic version, see above).
- `.xgd/tickets/hot/bug-23d1ec27.md` — HEAD frontmatter + incoming body
  composition; worth an operator glance that `status: bundled` /
  `bundled_in: bundle-8eef3846` is still the intended lifecycle position.
