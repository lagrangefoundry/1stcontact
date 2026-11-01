---
uid: report-a62da679
id: REPORT-7431
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:59:31.946844+00:00'
updated_at: '2026-11-01T06:59:31.946844+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md`: bookkeeping ticket (2e), sparse/index-only. Kept HEAD's side because it is a strict superset: the body is identical to incoming (incoming's C1–C4 section is already in HEAD), plus newer metadata (status bundled, commits, version 0.2.60, bundled_in bundle-94dbe947). Flagged for post-merge review per the enrichment rule.
- `.xgd/tickets/hot/request-72001560.md`: bookkeeping ticket (2e), sparse/index-only. Kept HEAD's side because it is a strict superset: same body as incoming (the ledger-surface rationale is already present), and status advanced from free_coded to bundled with bundled_in added. Flagged for post-merge review.
- `.xgd/tickets/hot/doc-d88e2e1c.md`: doc ticket (2e), non-overlapping. Kept HEAD's auto-merged front matter and wording ("describe" terminology, reconcile_shas), and appended incoming's new §12.1 ("Which producer was changed") and §12.2 ("A projection is only true if it covers what it says it is generated from"), both from BUG-48. Flagged for post-merge review.
- `apps/control-app/src/ai.ts`: code (2c.3b), integrated. Kept incoming's REQ-171 ledger wiring (`ledger: slug => chatLedger(tickets, sessionIdFor(slug))` and its imports). Used HEAD's `sessionPriming(knowledge)` signature, because the purpose is now owned by host-core's entry list. Dropped the unused CONSULTANT_PURPOSE import.
- `apps/control-app/src/session-knowledge.ts`: code (2c, BUG-1301 precedence). Kept HEAD's provider-pair `sessionPriming`. Ported incoming's intent: the mechanism is now `box.manual({ level: 'summary' })`.
- `apps/control-app/src/system-knowledge.ts`: code (2c, BUG-1301 precedence). Same treatment: HEAD's provider-pair `knowledgePriming`, with the summary manual ported in.
- `tools/generate/src/cli/ai/host.ts`: code (2c, BUG-1301 precedence). Dropped incoming's `nodeDeps` hunk, because HEAD had already replaced that function with the provider-pair assembly. Ported its REQ-171 summary-manual change (and comment) into HEAD's `mechanismFor`.
- `tools/generate/src/cli/ai/host-core.ts`: code (2c.3b), integrated. Kept incoming's `ledger?: (slug) => LedgerDeps` HostDeps field, with its doc, alongside HEAD's `priming` provider-pair field. Kept HEAD's `export { CONSULTANT_PURPOSE }` re-export and HEAD's Role construction (priming entries plus reminder provider). The no-knowledge fallback manual is now `{ level: 'summary' }`.
- `tools/generate/src/cli/ai/roles.ts` (not conflicted, edited during integration): incoming's new REQ-171 CONSULTANT_PURPOSE text, which names DOC-33, DOC-35 and DOC-31 and both corpora, now replaces the old text at its single declaration site in roles.ts, together with incoming's rationale. HEAD moved the declaration there (REQ-158: one declaration only).

## Incoming changes preserved

- REQ-171 ledger: the HostDeps.ledger field, ai.ts wiring, and ledger-core/ledger.ts/surface JSON (auto-merged) are all present.
- REQ-171 summary manual: present in all four places the manual is built (host.ts, session-knowledge.ts, system-knowledge.ts, host-core fallback).
- REQ-171 purpose text: present, in roles.ts and re-exported from host-core (the test imports it from there).
- BUG-48 doc sections §12.1 and §12.2 are present.
- Spot check: `tests/test_UAT_FC_REQ-171_session_texts.test.ts` passes 18/18. The ledger workers test could not run in the sandbox (listen EPERM, local port binding disabled).

BUG-1301 precedence: incoming's `KnowledgeDocs.open({ rolePurpose, mechanism })` bodies (session-knowledge, system-knowledge, host.ts nodeDeps, and the host-core `source:` Role field) were dropped. HEAD had already replaced that API with the km.landscape/km.mechanism provider pair in a documented refactor: the comments in system-knowledge.ts and host-core.ts state "`KnowledgeDocs.open()` is gone" and that the ordering now lives in host-core's entry list. The behavioural intent of those hunks (summary manual, new purpose text) was carried over onto the new structure rather than discarded.
