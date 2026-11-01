---
uid: report-ce635e7c
id: REPORT-7649
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:46:54.299977+00:00'
updated_at: '2026-11-01T14:46:54.299977+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

Incoming commit: 6f14528afd "Merge branch 'xgd-working' into free-BUG-48" (2026-09-02). HEAD already contains b62e984390, a LATER (2026-11-01) re-merge of the same branches plus subsequent work, so every conflict resolves to HEAD's (ours) side. Staged tree is identical to HEAD (no net diff) — a redundant commit, not a discarded one (see below).

- apps/control-app/src/ai.ts — code (2c/3h) — ours: incoming imports CONSULTANT_PURPOSE and passes it to sessionPriming(); HEAD's refactor removed that parameter (purpose now placed by host-core's entry list).
- apps/control-app/src/session-knowledge.ts — code (2c/3h) — ours: incoming uses KnowledgeDocs.open(...), an API removed upstream; HEAD uses the LANDSCAPE/MECHANISM provider pair.
- apps/control-app/src/system-knowledge.ts — code (2c/3h) — ours: same KnowledgeDocs.open → provider-pair supersession.
- tools/generate/src/cli/ai/host-core.ts — code (2c/3h) — ours: incoming's `ledger?:` dep is already present in HEAD (line 298); incoming's old `system/source/reminder` Role fields replaced in HEAD by priming/reminders entry lists; CONSULTANT_PURPOSE (identical text) moved to roles.ts:240 and re-exported.
- tools/generate/src/cli/ai/host.ts — code (2c/3h) — ours: incoming's nodeDeps() exists in HEAD (line 209), refactored to the provider-pair priming via a knowledge helper (REQ-171 "summary not reference" preserved at line 192).
- tools/generate/src/cli/ai/ledger-core.ts — AA (2b) — ours: both sides identical except one doc-comment phrase, reworded on HEAD by 3c2826f21d (reconcile bundle-94dbe947 quality fix).
- package.json — config/scalar (2g/3h) — ours: version 0.2.69 vs incoming's stale 0.2.58; downgrading the version would be wrong.
- .xgd/tickets/hot/bug-cb59cc4a.md, comment-2a38a753.md, comment-d394036b.md — bookkeeping (2e) — ours: HEAD is a strict superset (later updated_at, additional chat turns appended).
- .xgd/tickets/hot/request-72001560.md — bookkeeping (2e) — ours: HEAD is later (status free_and_reconciled, completed_at set, bundled_in: bundle-94dbe947) vs incoming free_coded.

Flagged for post-merge review per enrichment rule: all of the above (intent unknown on incoming side).

## Incoming changes preserved

All non-conflicting hunks of 6f14528afd (ledger.ts, ledger-surface.json, REQ-171 UAT tests, roles.ts, toolbox-core.ts, l1-surface.json, doc/comment tickets) auto-merged to content identical to HEAD — `git diff --cached HEAD` is empty. The incoming feature intent (REQ-171 ledger surface, summary-level manual, document-naming CONSULTANT_PURPOSE) is present in HEAD. Only the incoming side's obsolete API shapes in the conflicted hunks were dropped.

## Arbitration of last resort (BUG-1460)

Code files ai.ts, session-knowledge.ts, system-knowledge.ts, host-core.ts, host.ts, package.json — Tier 1 (most recent intent): incoming hunks target KnowledgeDocs.open / ContextSource role fields, which HEAD removed in a documented refactor (comments at session-knowledge.ts:365, system-knowledge.ts:186, host-core.ts:304 record "KnowledgeDocs.open() is gone"; landed via b62e984390, the later re-merge of the same branch). Applying incoming would reintroduce calls to a removed upstream API. Incoming side's conflicting hunks dropped; their substantive intent is already in HEAD.
