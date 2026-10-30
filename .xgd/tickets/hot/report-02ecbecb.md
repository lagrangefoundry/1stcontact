---
uid: report-02ecbecb
id: REPORT-5471
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:23:17.107072+00:00'
updated_at: '2026-09-29T05:23:17.107072+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Summary

Cherry-pick of `e9bd703bd9` ([FREE-CODED] REQ-160 — two-KB priming, the change
cursor, and the delta channel) produced 4 conflicts. All are resolved and staged.

The replayed commit is the ORIGINAL free-coded REQ-160 commit. HEAD already
carries that same work in evolved form — it descends from
`6ee97c4ce3 Merge branch 'free-REQ-160' into xgd-working` plus two later fix
commits on top. Every conflict is therefore original-vs-descendant, and every
hunk resolved to the HEAD side under the BUG-1301 precedence rule.

The remaining 8 files in the commit (`router.ts`, `tickets.ts`, `roles.ts`,
`assets.ts`, and four UATs) applied with ZERO net change — HEAD already matched
them byte for byte. No test function was deleted; no UAT file was in conflict.

Net staged diff against HEAD is empty. Python's finalize step should detect the
clean staged diff and skip the commit.

## Files resolved

- `apps/control-app/src/ai.ts` — UU (code). Single hunk: incoming passes
  `sessionPriming(knowledge, CARETAKER_PURPOSE)`; HEAD calls
  `sessionPriming(knowledge)`. Resolved to HEAD — the `rolePurpose` parameter no
  longer exists in the callee. Unconflicted REQ-160 delta wiring (lines 205-216)
  was already present on the HEAD side.
- `apps/control-app/src/session-knowledge.ts` — AA (both added), 5 hunks.
  Resolved to HEAD throughout: imports (`LANDSCAPE_PROVIDER`/
  `MECHANISM_PROVIDER`/`registerKmProviders` vs incoming `KnowledgeDocs`);
  `indexes`/`chunkIndexes` keyed by source name vs incoming `source`/
  `chunkSource` in both `search` and `chunk_search`; `projectKb()` hoisting; and
  `sessionPriming` as a two-provider pair vs incoming `KnowledgeDocs.open(...)`
  factory.
- `apps/control-app/src/session-delta.ts` — AA (both added), 1 hunk. Resolved to
  HEAD: persist-cursor predicate is `stored === null || ...` rather than
  incoming `... || chat === null`.
- `tools/generate/src/cli/ai/host-core.ts` — UU (code), 3 hunks. Resolved to
  HEAD: `priming` typed as the two-provider `{landscape, mechanism, register}`
  object rather than incoming `(box) => Promise<Untyped>`; the `delta` doc
  comment's matching reminder-provider wording; and deletion of the inline
  reminder-refresh block in `streamPrompt`.

## Incoming changes preserved

No incoming hunk survives verbatim, and none needed to. Each one's target was
superseded by a legitimate refactor already integrated into HEAD (BUG-1301
precedence). Per file:

- `session-knowledge.ts` — incoming's `KnowledgeDocs.open(composite,
  {rolePurpose, mechanism})` factory and its `source`/`chunkSource` runtime
  fields were removed by `6ee97c4ce3 Merge branch 'free-REQ-160' into
  xgd-working`, which replaced them with the KM provider-pair seam
  (`LANDSCAPE_PROVIDER` / `MECHANISM_PROVIDER` / `registerKmProviders`) and with
  per-source `indexes`/`chunkIndexes` maps. Legitimate: this is an upstream KM
  API change — the assembled-once snapshot cannot reflect a document published
  after the session opened — carrying its own rationale in the surviving
  doc comments, not a resolution shortcut. The REQ-160 capability itself
  (two-KB priming, one landscape section, project-first order) is fully present
  in HEAD's version.
- `ai.ts` — incoming's `CARETAKER_PURPOSE` argument is obsolete for the same
  reason and by the same commit: with the provider pair, `host-core.ts` owns the
  map/purpose/mechanism ordering in the entry list it builds the role from, so
  the purpose is no longer a parameter of `sessionPriming`. Passing it would not
  compile.
- `host-core.ts` — incoming's `priming?: (box) => Promise<Untyped>` signature is
  the same superseded seam. Incoming's inline reminder-refresh block in
  `streamPrompt` was relocated into `reminderFor()` by
  `12c967de95 Workflow fix_uat_validation completed: done`; HEAD's
  `reminderFor` (host-core.ts:645-650) performs the identical
  `deps.delta(sessionId)` read and `caretakerReminder(slug, ..., delta)`
  construction, resolved per-turn through the reminder provider. The REQ-160
  delta-rides-role.reminder behaviour is intact — only its call site moved.
  Verified `key`, `store`, and `baselines.set(key, ...)` still have live uses
  after the deleted block.
- `session-delta.ts` — incoming's `chat === null` persistence predicate was
  corrected to `stored === null` by
  `6f83befde4 Workflow fix_reconciliation_review completed: done`
  (xgd-kind: reconcile, xgd-intent: bundle-8e1807f6). Legitimate: keying on
  `chat === null` means a first turn that reports nothing writes no bookmark,
  after which the cursor falls back to coverage-from-now and silently skips
  everything uploaded in between. HEAD's version is a strict bug fix to the
  incoming line, with the reasoning recorded in the surviving comment.
